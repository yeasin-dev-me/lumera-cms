"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  StockAdjustment,
  StockAdjustmentStatus,
} from "@/types/inventory";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Ban,
  Clock,
  Loader2,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  ExternalLink,
  Boxes,
} from "lucide-react";

export default function StockAdjustmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { hasPermission } = usePermissions();

  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Reject modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  const loadAdjustment = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStockAdjustment(id);
      setAdjustment(data);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load adjustment details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAdjustment();
  }, [loadAdjustment]);

  const handleSubmit = async () => {
    if (!adjustment) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.submitStockAdjustment(adjustment.id);
      setAdjustment(updated);
      setActionSuccess("Adjustment submitted for approval.");
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit adjustment.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!adjustment) return;
    if (
      !confirm(
        "Approving will immediately write physical inventory deltas to the immutable ledger and adjust stock levels. Proceed?"
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.approveStockAdjustment(adjustment.id);
      setAdjustment(updated);
      setActionSuccess("Adjustment successfully approved and posted to movement ledger.");
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve adjustment.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = () => {
    setIsRejectModalOpen(true);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!adjustment) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.rejectStockAdjustment(adjustment.id, rejectReason);
      setAdjustment(updated);
      setIsRejectModalOpen(false);
      setActionSuccess("Adjustment has been rejected.");
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reject adjustment.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!adjustment) return;
    if (!confirm("Are you sure you want to cancel this adjustment voucher?")) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.cancelStockAdjustment(adjustment.id);
      setAdjustment(updated);
      setActionSuccess("Adjustment voucher cancelled.");
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel adjustment.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: StockAdjustmentStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="muted">Draft</Badge>;
      case "submitted":
        return (
          <Badge variant="warning" className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="success" className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved & Posted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="danger" className="inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "cancelled":
        return <Badge variant="muted" className="text-lumera-text-muted">Cancelled</Badge>;
    }
  };

  const canAdjust = hasPermission("inventory.adjust");
  const canApprove = hasPermission("inventory.approve_adjustment");

  if (loading) {
    return (
      <div className="p-12 text-center text-lumera-text-muted">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-brand" />
        Loading adjustment voucher details...
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="space-y-4">
        <Link
          href="/inventory/adjustments"
          className="text-xs text-brand hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Adjustments
        </Link>
        <Alert variant="danger">Adjustment not found.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back and Title Bar */}
      <div>
        <Link
          href="/inventory/adjustments"
          className="text-xs text-lumera-text-muted hover:text-lumera-text inline-flex items-center gap-1 mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Adjustments
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-lumera-text">
                {adjustment.adjustment_number}
              </h1>
              {getStatusBadge(adjustment.status)}
            </div>
            <p className="text-sm text-lumera-text-muted mt-1 capitalize">
              Reason: {adjustment.reason.replace(/_/g, " ")} &bull; Created on{" "}
              {new Date(adjustment.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {adjustment.status === "draft" && canAdjust && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="text-rose-500 hover:bg-rose-500/10"
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Cancel Voucher
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit for Approval
                </Button>
              </>
            )}

            {adjustment.status === "submitted" && (
              <>
                {canAdjust && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="text-lumera-text-muted"
                  >
                    Cancel
                  </Button>
                )}

                {canApprove && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleOpenReject}
                      disabled={actionLoading}
                      className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Approve & Post Ledger
                    </Button>
                  </>
                )}
              </>
            )}

            {adjustment.status === "approved" && (
              <Link href="/inventory/movements">
                <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                  <Boxes className="h-4 w-4 text-brand" />
                  View in Movements Ledger
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      {actionSuccess && (
        <Alert variant="success">
          {actionSuccess}
        </Alert>
      )}

      {/* Overview Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted block">
            Prepared By
          </span>
          <div className="mt-2 text-sm font-medium text-lumera-text">
            {adjustment.created_by_email || "System"}
          </div>
          <div className="text-xs text-lumera-text-muted mt-0.5">
            {new Date(adjustment.created_at).toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted block">
            Submission Time
          </span>
          <div className="mt-2 text-sm font-medium text-lumera-text">
            {adjustment.submitted_at ? new Date(adjustment.submitted_at).toLocaleString() : "Not submitted"}
          </div>
          <div className="text-xs text-lumera-text-muted mt-0.5">
            Status: <span className="capitalize">{adjustment.status}</span>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted block">
            Approval Details
          </span>
          <div className="mt-2 text-sm font-medium text-lumera-text">
            {adjustment.approved_by_email || "—"}
          </div>
          <div className="text-xs text-lumera-text-muted mt-0.5">
            {adjustment.approved_at ? new Date(adjustment.approved_at).toLocaleString() : "Pending review"}
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted block">
            Net Quantity Variance
          </span>
          <div className="mt-2 text-xl font-bold font-mono">
            {adjustment.total_variance_quantity > 0 ? (
              <span className="text-emerald-600">+{adjustment.total_variance_quantity} units</span>
            ) : adjustment.total_variance_quantity < 0 ? (
              <span className="text-rose-600">{adjustment.total_variance_quantity} units</span>
            ) : (
              <span className="text-lumera-text-muted">0 variance</span>
            )}
          </div>
          <div className="text-xs text-lumera-text-muted mt-0.5">
            Across {adjustment.items_count} line items
          </div>
        </Card>
      </div>

      {adjustment.notes && (
        <Card className="p-4 bg-surface border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted block mb-1">
            Voucher Notes
          </span>
          <p className="text-sm text-lumera-text">{adjustment.notes}</p>
        </Card>
      )}

      {/* Line Items Table */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-lumera-text">
            Inventory Count Line Items ({adjustment.items?.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 border-b border-border text-xs uppercase tracking-wider text-lumera-text-muted">
              <tr>
                <th className="px-5 py-3.5 font-medium">Product & SKU</th>
                <th className="px-5 py-3.5 font-medium">Batch / Lot</th>
                <th className="px-5 py-3.5 font-medium text-right">System Snapshot</th>
                <th className="px-5 py-3.5 font-medium text-right">Counted Physical</th>
                <th className="px-5 py-3.5 font-medium text-right">Variance Delta</th>
                <th className="px-5 py-3.5 font-medium text-right">Unit Cost</th>
                <th className="px-5 py-3.5 font-medium">Line Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adjustment.items?.map((item) => (
                <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-xs text-lumera-text">{item.product_name}</div>
                    <div className="font-mono text-[11px] text-lumera-text-muted">{item.product_sku}</div>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-lumera-text-muted">
                    {item.batch_number ? (
                      <Badge variant="muted" className="font-mono text-[10px]">
                        {item.batch_number}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-5 py-4 text-right font-mono text-xs text-lumera-text-muted">
                    {item.system_quantity}
                  </td>

                  <td className="px-5 py-4 text-right font-mono font-medium text-xs text-lumera-text">
                    {item.counted_quantity}
                  </td>

                  <td className="px-5 py-4 text-right font-mono font-bold text-xs">
                    {item.variance_quantity > 0 ? (
                      <span className="text-emerald-600">+{item.variance_quantity}</span>
                    ) : item.variance_quantity < 0 ? (
                      <span className="text-rose-600">{item.variance_quantity}</span>
                    ) : (
                      <span className="text-lumera-text-muted">0</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right font-mono text-xs text-lumera-text">
                    {item.unit_cost ? `৳${parseFloat(item.unit_cost).toFixed(2)}` : "—"}
                  </td>

                  <td className="px-5 py-4 text-xs text-lumera-text-muted max-w-xs truncate">
                    {item.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-lumera-text flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              Reject Stock Adjustment
            </h2>
            <p className="text-xs text-lumera-text-muted">
              Please enter the audit reason for rejecting voucher{" "}
              <span className="font-mono font-semibold">{adjustment.adjustment_number}</span>.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Recount required for SKU PM-BEV-001..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
