"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseOrder, PurchaseReceiptItemInput } from "@/types/procurement";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Truck,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ReceivingLineItem {
  po_item_id: number;
  product_name: string;
  product_sku: string;
  ordered_quantity: number;
  remaining_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  rejection_reason: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
}

function NewGoodsReceiptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPoId = searchParams?.get("po_id");

  const [confirmedPOs, setConfirmedPOs] = useState<PurchaseOrder[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<string>(preselectedPoId || "");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [deliveryNoteRef, setDeliveryNoteRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<ReceivingLineItem[]>([]);

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingPo, setLoadingPo] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load confirmed / partially received POs for selection
  useEffect(() => {
    async function loadPOs() {
      try {
        setLoadingInitial(true);
        const [resConfirmed, resPartial] = await Promise.all([
          adminApi.getPurchaseOrders({ status: "confirmed", page_size: 50 }),
          adminApi.getPurchaseOrders({ status: "partially_received", page_size: 50 }),
        ]);
        const combined = [...resConfirmed.results, ...resPartial.results];
        setConfirmedPOs(combined);
      } catch (err) {
        setError("Failed to load confirmed purchase orders.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadPOs();
  }, []);

  const loadPoDetails = useCallback(async (poId: string) => {
    try {
      setLoadingPo(true);
      setError(null);
      const po = await adminApi.getPurchaseOrder(poId);
      setSelectedPo(po);

      // Populate receiving lines with remaining quantities
      const lines: ReceivingLineItem[] = po.items
        .filter((it) => it.remaining_quantity > 0)
        .map((it) => ({
          po_item_id: it.id,
          product_name: it.product_name || it.product_name_snapshot,
          product_sku: it.product_sku || it.product_sku_snapshot,
          ordered_quantity: it.ordered_quantity,
          remaining_quantity: it.remaining_quantity,
          accepted_quantity: it.remaining_quantity,
          rejected_quantity: 0,
          rejection_reason: "",
          batch_number: "",
          manufacture_date: "",
          expiry_date: "",
        }));

      setItems(lines);
    } catch (err) {
      setError("Failed to load purchase order items.");
    } finally {
      setLoadingPo(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPoId) {
      loadPoDetails(selectedPoId);
    } else {
      setSelectedPo(null);
      setItems([]);
    }
  }, [selectedPoId, loadPoDetails]);

  const handleLineChange = (
    index: number,
    field: keyof ReceivingLineItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) {
      setError("Please select a purchase order.");
      return;
    }
    if (items.length === 0) {
      setError("No line items available to receive.");
      return;
    }

    // Validation
    let totalReceivedUnits = 0;
    for (const it of items) {
      const acc = it.accepted_quantity || 0;
      const rej = it.rejected_quantity || 0;
      totalReceivedUnits += acc + rej;

      if (acc > it.remaining_quantity) {
        setError(
          `Cannot accept ${acc} units for '${it.product_name}'. Only ${it.remaining_quantity} remaining on PO.`
        );
        return;
      }

      if (rej > 0 && !it.rejection_reason.trim()) {
        setError(
          `Rejection reason is required for '${it.product_name}' because ${rej} units were rejected.`
        );
        return;
      }

      if (it.manufacture_date && it.expiry_date && it.expiry_date < it.manufacture_date) {
        setError(`Expiry date cannot precede manufacture date for '${it.product_name}'.`);
        return;
      }
    }

    if (totalReceivedUnits === 0) {
      setError("At least one unit must be accepted or rejected to record a goods receipt.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payloadItems: PurchaseReceiptItemInput[] = items.map((it) => ({
        po_item_id: it.po_item_id,
        accepted_quantity: it.accepted_quantity,
        rejected_quantity: it.rejected_quantity,
        rejection_reason: it.rejection_reason,
        batch_number: it.batch_number,
        manufacture_date: it.manufacture_date || null,
        expiry_date: it.expiry_date || null,
      }));

      const receipt = await adminApi.createPurchaseReceipt({
        purchase_order_id: Number(selectedPoId),
        receipt_date: receiptDate,
        delivery_note_ref: deliveryNoteRef,
        notes,
        items: payloadItems,
      });

      router.push(`/procurement/receipts/${receipt.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to record goods receipt.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading purchase order data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/procurement/receipts"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Record Goods Receipt (GRN)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Inspect physical delivery, capture batch and expiry dates, and update PO balances.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Selection & Metadata */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Receipt Header & Reference
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Purchase Order *
              </label>
              <select
                required
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
              >
                <option value="">-- Select Confirmed PO --</option>
                {confirmedPOs.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} - {po.supplier_name} ({po.total_received_quantity}/{po.total_ordered_quantity} rcvd)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Receipt Date *
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Delivery Note / Challan Ref
              </label>
              <input
                type="text"
                placeholder="e.g. CH-2026-9012"
                value={deliveryNoteRef}
                onChange={(e) => setDeliveryNoteRef(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Warehouse / Receiving Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condition of shipment, vehicle number, unloading remarks..."
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Line Items Inspection & Batch Capture */}
        {selectedPo && (
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Physical Receiving & Batch Inspection
            </h2>

            {loadingPo ? (
              <div className="py-12 text-center text-gray-500 flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                Loading line items...
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                All items on this purchase order have already been received.
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((line, idx) => (
                  <div
                    key={line.po_item_id}
                    className="p-4 border rounded-xl bg-gray-50/50 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {line.product_name}
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          SKU: {line.product_sku}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 bg-white px-3 py-1.5 rounded-lg border font-medium">
                        Remaining on PO:{" "}
                        <strong className="text-indigo-600 font-bold">
                          {line.remaining_quantity}
                        </strong>{" "}
                        units
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-emerald-800 mb-1">
                          Accepted Qty *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={line.remaining_quantity}
                          value={line.accepted_quantity}
                          onChange={(e) =>
                            handleLineChange(
                              idx,
                              "accepted_quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/30 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-rose-800 mb-1">
                          Rejected Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={line.rejected_quantity}
                          onChange={(e) =>
                            handleLineChange(
                              idx,
                              "rejected_quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/30"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Batch / Lot Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. LOT-2026-X"
                          value={line.batch_number}
                          onChange={(e) =>
                            handleLineChange(idx, "batch_number", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Manufacture Date
                        </label>
                        <input
                          type="date"
                          value={line.manufacture_date}
                          onChange={(e) =>
                            handleLineChange(idx, "manufacture_date", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={line.expiry_date}
                          min={line.manufacture_date || undefined}
                          onChange={(e) =>
                            handleLineChange(idx, "expiry_date", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      {line.rejected_quantity > 0 && (
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-rose-800 mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            Rejection Reason *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Broken seal, damaged packaging, leaking..."
                            value={line.rejection_reason}
                            onChange={(e) =>
                              handleLineChange(idx, "rejection_reason", e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-rose-900"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/procurement/receipts">
            <Button type="button" variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving || !selectedPo || items.length === 0}
            className="flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording GRN...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Confirm Goods Receipt
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewGoodsReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm">Loading Goods Receipt Form...</p>
        </div>
      }
    >
      <NewGoodsReceiptForm />
    </Suspense>
  );
}
