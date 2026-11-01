"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseBill, PurchaseBillStatus } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Ban,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function PurchaseBillDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { hasPermission } = usePermissions();

  const [bill, setBill] = useState<PurchaseBill | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [posting, setPosting] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const loadBill = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPurchaseBill(id);
      setBill(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load purchase bill.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const handlePost = async () => {
    if (
      !confirm(
        "Are you sure you want to post this purchase bill? This will atomically create FIFO CostLayers and append-only StockMovements in the inventory subledger. This action cannot be reversed."
      )
    ) {
      return;
    }

    try {
      setPosting(true);
      setError(null);
      const updated = await adminApi.postPurchaseBill(id);
      setBill(updated);
      setSuccessMsg(
        `Purchase bill ${updated.bill_number} has been posted to inventory subledger successfully.`
      );
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to post purchase bill.");
      }
    } finally {
      setPosting(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt("Enter a reason for cancelling this draft purchase bill:");
    if (!reason || !reason.trim()) return;

    try {
      setCancelling(true);
      setError(null);
      const updated = await adminApi.cancelPurchaseBill(id, reason.trim());
      setBill(updated);
      setSuccessMsg(`Purchase bill ${updated.bill_number} has been cancelled.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel purchase bill.");
      }
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: PurchaseBillStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="muted">Draft Voucher</Badge>;
      case "posted":
        return <Badge variant="success">Posted & Capitalized</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading purchase bill details...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{error || "Purchase bill not found."}</Alert>
        <Link href="/procurement/purchase-bills">
          <Button variant="secondary">Back to Bills</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/purchase-bills"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-mono">
                {bill.bill_number}
              </h1>
              {getStatusBadge(bill.status)}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Vendor: {bill.supplier_name}{" "}
              {bill.supplier_invoice_ref && (
                <span className="font-mono text-xs">
                  &bull; Invoice Ref: {bill.supplier_invoice_ref}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {bill.status === "draft" && hasPermission("purchases.post_bill") && (
            <Button
              onClick={handlePost}
              disabled={posting}
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              {posting ? "Posting to Inventory..." : "Post Bill to Inventory"}
            </Button>
          )}

          {bill.status === "draft" && hasPermission("purchases.create") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Ban className="h-4 w-4 mr-1" />
              {cancelling ? "Cancelling..." : "Cancel Bill"}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && (
        <Alert variant="success">
          {successMsg}
        </Alert>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs uppercase font-medium text-gray-500 mb-1">Raw Subtotal</div>
          <div className="text-lg font-semibold text-gray-900">
            ৳{parseFloat(bill.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500">{bill.items_count} items billed</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase font-medium text-indigo-600 mb-1">
            Total Landed Costs
          </div>
          <div className="text-lg font-semibold text-indigo-900">
            +৳{parseFloat(bill.total_landed_costs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500">Freight, customs & fees</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase font-medium text-emerald-700 mb-1">
            Capitalized Total
          </div>
          <div className="text-xl font-bold text-emerald-950">
            ৳{parseFloat(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500">Inventory valuation total</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase font-medium text-gray-500 mb-1">Schedule</div>
          <div className="text-sm font-medium text-gray-900">Bill: {bill.bill_date}</div>
          <div className="text-xs text-gray-500">Due: {bill.due_date}</div>
        </Card>
      </div>

      {/* Posting Status & Audit Information */}
      <Card className="p-4 bg-gray-50 border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600" />
          <span>
            Created by: <strong className="text-gray-900">{bill.created_by_email || "Staff"}</strong>
          </span>
          {bill.po_number && (
            <span>
              &bull; Purchase Order:{" "}
              <Link
                href={`/procurement/purchase-orders/${bill.purchase_order}`}
                className="font-mono text-indigo-600 font-semibold hover:underline"
              >
                {bill.po_number}
              </Link>
            </span>
          )}
        </div>
        {bill.status === "posted" && bill.posted_by_email && (
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Posted by {bill.posted_by_email} on{" "}
            {bill.posted_at ? new Date(bill.posted_at).toLocaleString() : ""}
          </div>
        )}
      </Card>

      {/* Capitalized Line Items Table */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Billed Line Items & Capitalized Cost Layers ({bill.items.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
              <tr>
                <th className="px-3 py-2.5">Product</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Raw Unit (৳)</th>
                <th className="px-3 py-2.5 text-right">Raw Total (৳)</th>
                <th className="px-3 py-2.5 text-right text-indigo-700">Allocated Landed (৳)</th>
                <th className="px-3 py-2.5 text-right">Landed Line Total (৳)</th>
                <th className="px-3 py-2.5 text-right text-emerald-800 font-semibold">
                  FIFO Landed Unit (৳)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bill.items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-gray-900">{it.product_name}</div>
                    <div className="text-xs font-mono text-gray-400">
                      SKU: {it.product_sku}
                      {it.batch_number && <span> &bull; Batch: {it.batch_number}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                    {it.billed_quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    ৳{parseFloat(it.raw_unit_cost).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    ৳{parseFloat(it.raw_line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-indigo-700 font-medium">
                    +৳{parseFloat(it.allocated_landed_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-medium text-gray-900">
                    ৳{parseFloat(it.landed_line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-800">
                    ৳{parseFloat(it.landed_unit_cost).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50/50 font-semibold text-gray-900">
              <tr>
                <td className="px-3 py-2.5 text-xs uppercase text-gray-500">Totals</td>
                <td className="px-3 py-2.5 text-right">{bill.total_billed_quantity}</td>
                <td className="px-3 py-2.5 text-right">-</td>
                <td className="px-3 py-2.5 text-right">
                  ৳{parseFloat(bill.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 text-right text-indigo-700">
                  +৳{parseFloat(bill.total_landed_costs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={2} className="px-3 py-2.5 text-right text-base text-emerald-950 font-bold">
                  ৳{parseFloat(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Landed Cost Allocations Breakdown Table */}
      {bill.landed_cost_allocations && bill.landed_cost_allocations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            Landed Cost Allocation Audit Trail
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 uppercase font-medium text-gray-500 border-b">
                <tr>
                  <th className="px-3 py-2">Item SKU</th>
                  <th className="px-3 py-2">Expense Category</th>
                  <th className="px-3 py-2">Allocation Method</th>
                  <th className="px-3 py-2 text-right">Proportional Ratio</th>
                  <th className="px-3 py-2 text-right">Allocated Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill.landed_cost_allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-mono font-medium text-gray-900">
                      {alloc.product_sku}
                    </td>
                    <td className="px-3 py-2 capitalize font-medium text-gray-800">
                      {alloc.cost_category}
                    </td>
                    <td className="px-3 py-2 capitalize text-gray-600">
                      {alloc.allocation_method}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">
                      {(parseFloat(alloc.ratio) * 100).toFixed(4)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-700">
                      ৳{parseFloat(alloc.allocated_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Subledger Integration Link */}
      {bill.status === "posted" && (
        <Card className="p-4 bg-emerald-50/40 border-emerald-200 flex items-center justify-between">
          <div className="text-xs text-emerald-900">
            <strong>Subledger Posting Active:</strong> Cost layers and stock movements for this bill
            are recorded in the inventory domain.
          </div>
          <Link
            href={`/inventory/movements?q=${bill.bill_number}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            View Movements Ledger
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Card>
      )}
    </div>
  );
}
