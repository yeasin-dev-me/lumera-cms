"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseOrder, PurchaseOrderStatus } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  Truck,
  Ban,
  Clock,
  Building2,
  Calendar,
  CreditCard,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { hasPermission } = usePermissions();

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [approving, setApproving] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const loadPo = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPurchaseOrder(id);
      setPo(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load purchase order details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPo();
  }, [loadPo]);

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this purchase order under maker-checker controls? Once approved, goods can be received.")) {
      return;
    }
    try {
      setApproving(true);
      setError(null);
      const updated = await adminApi.approvePurchaseOrder(id);
      setPo(updated);
      setSuccessMsg(`Purchase order ${updated.po_number} has been approved and confirmed.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve purchase order.");
      }
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt("Please provide a reason for cancelling this purchase order:");
    if (!reason || !reason.trim()) return;

    try {
      setCancelling(true);
      setError(null);
      const updated = await adminApi.cancelPurchaseOrder(id, reason.trim());
      setPo(updated);
      setSuccessMsg(`Purchase order ${updated.po_number} has been cancelled.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel purchase order.");
      }
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="muted"><Clock className="h-3 w-3 mr-1 inline" />Draft</Badge>;
      case "confirmed":
        return <Badge variant="primary"><CheckCircle className="h-3 w-3 mr-1 inline" />Confirmed</Badge>;
      case "partially_received":
        return <Badge variant="warning"><Truck className="h-3 w-3 mr-1 inline" />Partially Received</Badge>;
      case "received":
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1 inline" />Fully Received</Badge>;
      case "cancelled":
        return <Badge variant="danger"><Ban className="h-3 w-3 mr-1 inline" />Cancelled</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading purchase order voucher...</p>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{error || "Purchase order not found."}</Alert>
        <Link href="/procurement/purchase-orders">
          <Button variant="secondary">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Status Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/purchase-orders"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-mono">
                {po.po_number}
              </h1>
              {getStatusBadge(po.status)}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Ordered on {po.order_date} &bull; Supplier: {po.supplier_name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {po.status === "draft" && hasPermission("purchases.approve") && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              {approving ? "Approving..." : "Approve Order"}
            </Button>
          )}

          {(po.status === "confirmed" || po.status === "partially_received") && hasPermission("purchases.receive") && (
            <Link href={`/procurement/receipts/new?po_id=${po.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5">
                <Truck className="h-4 w-4" />
                Receive Goods (GRN)
              </Button>
            </Link>
          )}

          {(po.status === "confirmed" || po.status === "received" || po.status === "partially_received") && hasPermission("purchases.create") && (
            <Link href={`/procurement/purchase-bills/new?po_id=${po.id}`}>
              <Button variant="secondary" className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Create Bill
              </Button>
            </Link>
          )}

          {(po.status === "draft" || (po.status === "confirmed" && po.total_received_quantity === 0)) &&
            hasPermission("purchases.create") && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Ban className="h-4 w-4 mr-1" />
                {cancelling ? "Cancelling..." : "Cancel PO"}
              </Button>
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
            <div className="font-semibold text-gray-900">{po.supplier_name}</div>
            <div className="text-xs font-mono text-gray-400">{po.supplier_code}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-emerald-600 p-1.5 bg-emerald-50 rounded-lg shrink-0" />
          <div>
            <div className="text-xs uppercase font-medium text-gray-500">Schedule</div>
            <div className="text-sm text-gray-900">Ordered: {po.order_date}</div>
            <div className="text-xs text-gray-500">
              Delivery: {po.expected_delivery_date || "Not specified"}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-amber-600 p-1.5 bg-amber-50 rounded-lg shrink-0" />
          <div>
            <div className="text-xs uppercase font-medium text-gray-500">Voucher Total</div>
            <div className="text-lg font-bold text-gray-900">
              ৳{parseFloat(po.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500">
              {po.total_received_quantity} of {po.total_ordered_quantity} units received
            </div>
          </div>
        </Card>
      </div>

      {/* Maker-Checker Audit Banner */}
      <Card className="p-4 bg-gray-50 border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            Created by: <strong className="text-gray-900">{po.created_by_email || "System"}</strong>
          </span>
        </div>
        {po.approved_by_email && (
          <div>
            Approved by: <strong className="text-gray-900">{po.approved_by_email}</strong> &bull;{" "}
            {po.approved_at ? new Date(po.approved_at).toLocaleString() : ""}
          </div>
        )}
      </Card>

      {/* Line Items Table */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Ordered Line Items ({po.items.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Ordered</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-right">Unit Price (৳)</th>
                <th className="px-4 py-3 text-right">Line Total (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {po.items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {it.product_name || it.product_name_snapshot}
                    {it.notes && (
                      <div className="text-xs text-gray-400 font-normal">{it.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {it.product_sku || it.product_sku_snapshot}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {it.ordered_quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                    {it.received_quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {it.remaining_quantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ৳{parseFloat(it.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ৳{parseFloat(it.line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50/50 font-semibold text-gray-900">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-xs uppercase text-gray-500">
                  Total
                </td>
                <td className="px-4 py-3 text-right">{po.total_ordered_quantity}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{po.total_received_quantity}</td>
                <td className="px-4 py-3 text-right">{po.total_ordered_quantity - po.total_received_quantity}</td>
                <td className="px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right text-base text-indigo-700">
                  ৳{parseFloat(po.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {po.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <strong className="block text-gray-900 mb-1">Voucher Notes:</strong>
            <pre className="whitespace-pre-wrap font-sans">{po.notes}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
