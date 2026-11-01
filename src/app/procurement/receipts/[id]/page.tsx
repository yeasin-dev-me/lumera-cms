"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseReceipt, PurchaseInspectionStatus } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Truck,
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Ban,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function GoodsReceiptDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { hasPermission } = usePermissions();

  const [receipt, setReceipt] = useState<PurchaseReceipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const loadReceipt = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPurchaseReceipt(id);
      setReceipt(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load goods receipt note.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const handleCancel = async () => {
    const reason = prompt("Enter a reason for cancelling this goods receipt note:");
    if (!reason || !reason.trim()) return;

    try {
      setCancelling(true);
      setError(null);
      const updated = await adminApi.cancelPurchaseReceipt(id, reason.trim());
      setReceipt(updated);
      setSuccessMsg(`Goods receipt ${updated.receipt_number} has been cancelled.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel goods receipt.");
      }
    } finally {
      setCancelling(false);
    }
  };

  const getInspectionBadge = (status: PurchaseInspectionStatus) => {
    switch (status) {
      case "passed":
        return <Badge variant="success">Passed</Badge>;
      case "partial":
        return <Badge variant="warning">Partial Passed</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading goods receipt details...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{error || "Goods receipt not found."}</Alert>
        <Link href="/procurement/receipts">
          <Button variant="secondary">Back to Receipts</Button>
        </Link>
      </div>
    );
  }

  const isBilledAny = receipt.items.some((it) => it.billed_quantity > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/receipts"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-mono">
                {receipt.receipt_number}
              </h1>
              {receipt.status === "received" ? (
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1 inline" />
                  Received
                </Badge>
              ) : (
                <Badge variant="danger">
                  <Ban className="h-3 w-3 mr-1 inline" />
                  Cancelled
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              PO:{" "}
              <Link
                href={`/procurement/purchase-orders/${receipt.purchase_order}`}
                className="font-mono text-indigo-600 hover:underline"
              >
                {receipt.po_number}
              </Link>{" "}
              &bull; Supplier: {receipt.supplier_name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {receipt.status === "received" && !isBilledAny && hasPermission("purchases.receive") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Ban className="h-4 w-4 mr-1" />
              {cancelling ? "Cancelling..." : "Cancel GRN"}
            </Button>
          )}

          {receipt.status === "received" && hasPermission("purchases.create") && (
            <Link href={`/procurement/purchase-bills/new?po_id=${receipt.purchase_order}`}>
              <Button size="sm" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Create Bill from PO
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-indigo-600 p-1.5 bg-indigo-50 rounded-lg shrink-0" />
          <div>
            <div className="text-xs uppercase font-medium text-gray-500">Supplier</div>
            <div className="font-semibold text-gray-900">{receipt.supplier_name}</div>
            <div className="text-xs text-gray-500 font-mono">
              Challan: {receipt.delivery_note_ref || "None"}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-emerald-600 p-1.5 bg-emerald-50 rounded-lg shrink-0" />
          <div>
            <div className="text-xs uppercase font-medium text-gray-500">Receipt Date</div>
            <div className="text-sm font-semibold text-gray-900">{receipt.receipt_date}</div>
            <div className="text-xs text-gray-500">
              Received by: {receipt.received_by_email || "Staff"}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <Truck className="h-8 w-8 text-amber-600 p-1.5 bg-amber-50 rounded-lg shrink-0" />
          <div>
            <div className="text-xs uppercase font-medium text-gray-500">Inspected Units</div>
            <div className="text-base font-bold text-gray-900">
              {receipt.total_accepted_quantity} Accepted
            </div>
            {receipt.total_rejected_quantity > 0 && (
              <div className="text-xs text-rose-600 font-medium">
                {receipt.total_rejected_quantity} Units Rejected
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Inspected Items ({receipt.items.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Batch / Lot</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-right">Accepted</th>
                <th className="px-4 py-3 text-right">Rejected</th>
                <th className="px-4 py-3 text-right">Billed / Unbilled</th>
                <th className="px-4 py-3">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receipt.items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{it.product_name}</div>
                    <div className="text-xs font-mono text-gray-400">{it.product_sku}</div>
                    {it.rejection_reason && (
                      <div className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Rejection reason: {it.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {it.batch_number || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>Mfg: {it.manufacture_date || "-"}</div>
                    <div>Exp: {it.expiry_date || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    {it.accepted_quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">
                    {it.rejected_quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className="font-semibold text-gray-900">{it.billed_quantity}</span>
                    {" / "}
                    <span className="text-indigo-600 font-medium">{it.unbilled_quantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getInspectionBadge(it.inspection_status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {receipt.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <strong className="block text-gray-900 mb-1">Receipt Notes:</strong>
            <pre className="whitespace-pre-wrap font-sans">{receipt.notes}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
