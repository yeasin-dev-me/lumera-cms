"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  Supplier,
  PurchaseOrder,
  PurchaseBillItemInput,
  LandedCostAllocationMethod,
} from "@/types/procurement";
import { ProductDetail as Product } from "@/types/catalog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Scale,
  DollarSign,
  Loader2,
} from "lucide-react";

interface BillLineItemState {
  product_id: number;
  product_name?: string;
  product_sku?: string;
  receipt_item_id?: number | null;
  billed_quantity: number;
  raw_unit_cost: string;
  allocation_weight: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  notes: string;
}

function NewPurchaseBillForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPoId = searchParams?.get("po_id");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Form Fields
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [poId, setPoId] = useState<number | "">(preselectedPoId ? Number(preselectedPoId) : "");
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState<string>("");
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  // Landed Cost charges
  const [freightCharges, setFreightCharges] = useState<string>("0.00");
  const [customsDuties, setCustomsDuties] = useState<string>("0.00");
  const [clearingCharges, setClearingCharges] = useState<string>("0.00");
  const [otherLandedCosts, setOtherLandedCosts] = useState<string>("0.00");
  const [allocationMethod, setAllocationMethod] = useState<LandedCostAllocationMethod>("value");

  const [items, setItems] = useState<BillLineItemState[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoadingInitial(true);
        const [suppRes, poRes, prodRes] = await Promise.all([
          adminApi.getSuppliers({ is_active: true, page_size: 100 }),
          adminApi.getPurchaseOrders({ page_size: 50 }),
          adminApi.getProducts({ page_size: 100 }),
        ]);
        setSuppliers(suppRes.results);
        setPurchaseOrders(poRes.results);
        setProducts(prodRes.results);
      } catch (err) {
        setError("Failed to load initial supplier and product master data.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadMeta();
  }, []);

  // When PO is selected, auto-populate supplier and items if empty
  const handlePoChange = useCallback(
    async (selectedId: number | "") => {
      setPoId(selectedId);
      if (!selectedId) return;

      try {
        const po = await adminApi.getPurchaseOrder(selectedId);
        setSupplierId(po.supplier);

        // Pre-populate items from PO
        const draftItems: BillLineItemState[] = po.items.map((it) => ({
          product_id: it.product,
          product_name: it.product_name || it.product_name_snapshot,
          product_sku: it.product_sku || it.product_sku_snapshot,
          billed_quantity: it.received_quantity > 0 ? it.received_quantity : it.ordered_quantity,
          raw_unit_cost: it.unit_price,
          allocation_weight: "1.000",
          batch_number: "",
          manufacture_date: "",
          expiry_date: "",
          notes: "",
        }));

        setItems(draftItems);
      } catch (err) {
        // silently ignore PO fetch errors
      }
    },
    []
  );

  useEffect(() => {
    if (preselectedPoId && !loadingInitial) {
      handlePoChange(Number(preselectedPoId));
    }
  }, [preselectedPoId, loadingInitial, handlePoChange]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: defaultProduct.id,
        product_name: defaultProduct.name,
        product_sku: defaultProduct.sku,
        billed_quantity: 1,
        raw_unit_cost: String(defaultProduct.price || "0.00"),
        allocation_weight: "1.000",
        batch_number: "",
        manufacture_date: "",
        expiry_date: "",
        notes: "",
      },
    ]);
  };

  const handleProductChange = (index: number, newProductId: number) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        raw_unit_cost: String(prod.price || "0.00"),
      };
      return copy;
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof BillLineItemState,
    val: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const rawSubtotal = items.reduce((acc, it) => {
    return acc + (it.billed_quantity || 0) * (parseFloat(it.raw_unit_cost) || 0);
  }, 0);

  const freight = parseFloat(freightCharges) || 0;
  const customs = parseFloat(customsDuties) || 0;
  const clearing = parseFloat(clearingCharges) || 0;
  const other = parseFloat(otherLandedCosts) || 0;
  const totalLanded = freight + customs + clearing + other;
  const totalBillAmount = rawSubtotal + totalLanded;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one line item.");
      return;
    }

    if (allocationMethod === "weight") {
      for (const it of items) {
        if (!it.allocation_weight || parseFloat(it.allocation_weight) <= 0) {
          setError(
            `Weight-based allocation requires positive weight on every line item. Line for '${it.product_name}' has invalid weight.`
          );
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payloadItems: PurchaseBillItemInput[] = items.map((it) => ({
        product_id: it.product_id,
        receipt_item_id: it.receipt_item_id || null,
        billed_quantity: it.billed_quantity,
        raw_unit_cost: it.raw_unit_cost,
        allocation_weight: it.allocation_weight ? parseFloat(it.allocation_weight) : null,
        batch_number: it.batch_number,
        manufacture_date: it.manufacture_date || null,
        expiry_date: it.expiry_date || null,
        notes: it.notes,
      }));

      const bill = await adminApi.createPurchaseBill({
        supplier_id: Number(supplierId),
        purchase_order_id: poId ? Number(poId) : null,
        supplier_invoice_ref: supplierInvoiceRef,
        bill_date: billDate,
        due_date: dueDate,
        freight_charges: freight,
        customs_duties: customs,
        clearing_charges: clearing,
        other_landed_costs: other,
        allocation_method: allocationMethod,
        notes,
        items: payloadItems,
      });

      router.push(`/procurement/purchase-bills/${bill.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create purchase bill.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading billing metadata...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/procurement/purchase-bills"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-indigo-600" />
            Create Purchase Bill
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Record supplier invoice, allocate acquisition costs, and prepare inventory capitalization.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Invoice Metadata */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Supplier & Voucher Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="">-- Select Active Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Purchase Order Reference
              </label>
              <select
                value={poId}
                onChange={(e) => handlePoChange(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
              >
                <option value="">-- None / Standalone Bill --</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} - {po.supplier_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supplier Invoice Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9921"
                value={supplierInvoiceRef}
                onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bill Date *
              </label>
              <input
                type="date"
                required
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                min={billDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Billing Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commercial terms, tax breakdowns, or payment notes..."
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Landed Cost Allocation Settings */}
        <Card className="p-6 border-indigo-100 bg-indigo-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Scale className="h-4 w-4 text-indigo-600" />
                Landed Cost Acquisition Charges
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Eligible acquisition expenses distributed across items and capitalized into FIFO cost layers.
              </p>
            </div>

            {/* Allocation Method Toggle */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
              <button
                type="button"
                onClick={() => setAllocationMethod("value")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  allocationMethod === "value"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Value-Based
              </button>
              <button
                type="button"
                onClick={() => setAllocationMethod("weight")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  allocationMethod === "weight"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Weight-Based
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Freight Charges (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freightCharges}
                onChange={(e) => setFreightCharges(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customs Duties (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customsDuties}
                onChange={(e) => setCustomsDuties(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Port / Clearing Charges (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={clearingCharges}
                onChange={(e) => setClearingCharges(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Other Acquisition Costs (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={otherLandedCosts}
                onChange={(e) => setOtherLandedCosts(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Bill Line Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Bill Line Items ({items.length})
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItem}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Product Line
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-gray-500 border-2 border-dashed rounded-lg">
              No products added yet. Click &quot;Add Product Line&quot; to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
                  <tr>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5 w-24">Qty</th>
                    <th className="px-3 py-2.5 w-32">Raw Cost (৳)</th>
                    {allocationMethod === "weight" && (
                      <th className="px-3 py-2.5 w-28">Weight (kg)</th>
                    )}
                    <th className="px-3 py-2.5 w-32">Raw Total (৳)</th>
                    <th className="px-3 py-2.5 w-28">Batch No</th>
                    <th className="px-3 py-2.5 w-32">Expiry</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => {
                    const lineRawTotal =
                      (it.billed_quantity || 0) * (parseFloat(it.raw_unit_cost) || 0);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2">
                          <select
                            value={it.product_id}
                            onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={it.billed_quantity}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "billed_quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.raw_unit_cost}
                            onChange={(e) =>
                              handleItemChange(idx, "raw_unit_cost", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        {allocationMethod === "weight" && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.001"
                              min="0.001"
                              value={it.allocation_weight}
                              onChange={(e) =>
                                handleItemChange(idx, "allocation_weight", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 font-mono font-medium text-gray-900">
                          ৳{lineRawTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Optional..."
                            value={it.batch_number}
                            onChange={(e) =>
                              handleItemChange(idx, "batch_number", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-xs border rounded font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={it.expiry_date}
                            onChange={(e) =>
                              handleItemChange(idx, "expiry_date", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-gray-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Grand Totals Preview */}
          <div className="mt-6 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs uppercase text-gray-500 block">Raw Merchandise Subtotal</span>
              <span className="text-lg font-semibold text-gray-900">
                ৳{rawSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-indigo-50/50 rounded-lg">
              <span className="text-xs uppercase text-indigo-700 block">Total Landed Costs</span>
              <span className="text-lg font-semibold text-indigo-900">
                +৳{totalLanded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-lg">
              <span className="text-xs uppercase text-emerald-800 block">Total Capitalized Bill</span>
              <span className="text-2xl font-bold text-emerald-950">
                ৳{totalBillAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/procurement/purchase-bills">
            <Button type="button" variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="flex items-center gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Draft Bill...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Draft Purchase Bill
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewPurchaseBillPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm">Loading Purchase Bill Form...</p>
        </div>
      }
    >
      <NewPurchaseBillForm />
    </Suspense>
  );
}
