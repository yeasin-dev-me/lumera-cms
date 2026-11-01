"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Supplier, PurchaseOrderItemInput } from "@/types/procurement";
import { ProductDetail as Product } from "@/types/catalog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

interface DraftLineItem {
  product_id: number;
  product_name?: string;
  product_sku?: string;
  ordered_quantity: number;
  unit_price: string;
  notes: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Form State
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<DraftLineItem[]>([]);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoadingInitial(true);
        const [suppRes, prodRes] = await Promise.all([
          adminApi.getSuppliers({ is_active: true, page_size: 100 }),
          adminApi.getProducts({ page_size: 100 }),
        ]);
        setSuppliers(suppRes.results);
        setProducts(prodRes.results);
      } catch (err) {
        setError("Failed to load initial supplier and product master data.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadMeta();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: defaultProduct.id,
        product_name: defaultProduct.name,
        product_sku: defaultProduct.sku,
        ordered_quantity: 1,
        unit_price: String(defaultProduct.price || "0.00"),
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
        unit_price: String(prod.price || "0.00"),
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof DraftLineItem, val: string | number) => {
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
  const totalUnits = items.reduce((acc, it) => acc + (it.ordered_quantity || 0), 0);
  const subtotal = items.reduce((acc, it) => {
    const qty = it.ordered_quantity || 0;
    const price = parseFloat(it.unit_price) || 0;
    return acc + qty * price;
  }, 0);

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

    // Check for duplicate products
    const seen = new Set<number>();
    for (const it of items) {
      if (seen.has(it.product_id)) {
        setError(`Duplicate product in purchase order. Please combine line items for the same product.`);
        return;
      }
      seen.add(it.product_id);
    }

    try {
      setSaving(true);
      setError(null);
      const payloadItems: PurchaseOrderItemInput[] = items.map((it) => ({
        product_id: it.product_id,
        ordered_quantity: it.ordered_quantity,
        unit_price: it.unit_price,
        notes: it.notes,
      }));

      const po = await adminApi.createPurchaseOrder({
        supplier_id: Number(supplierId),
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || null,
        notes,
        items: payloadItems,
      });

      router.push(`/procurement/purchase-orders/${po.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create purchase order.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading catalog and supplier options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/procurement/purchase-orders"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            Create Purchase Order
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Draft a procurement voucher for maker-checker review and approval.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Header Information */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Vendor & Order Details
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
                Order Date *
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                min={orderDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes & Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery instructions, terms, or reference numbers..."
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Purchase Line Items ({items.length})
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
                    <th className="px-3 py-2.5 w-28">Quantity</th>
                    <th className="px-3 py-2.5 w-36">Unit Buying Price (৳)</th>
                    <th className="px-3 py-2.5 w-36">Line Total (৳)</th>
                    <th className="px-3 py-2.5">Notes</th>
                    <th className="px-3 py-2.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => {
                    const lineTotal = (it.ordered_quantity || 0) * (parseFloat(it.unit_price) || 0);
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
                            value={it.ordered_quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "ordered_quantity", parseInt(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.unit_price}
                            onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-gray-900">
                          ৳{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={it.notes}
                            onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
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

          {/* Totals Summary */}
          {items.length > 0 && (
            <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-end justify-between gap-4">
              <div className="text-sm text-gray-500">
                Total Ordered Units: <span className="font-semibold text-gray-900">{totalUnits}</span>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase text-gray-500 block">Subtotal</span>
                <span className="text-2xl font-bold text-gray-900">
                  ৳{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/procurement/purchase-orders">
            <Button type="button" variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="flex items-center gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save as Draft PO
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
