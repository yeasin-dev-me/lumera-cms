"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { JournalEntry, JournalStatus } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Send,
  CheckSquare,
  XCircle,
  RotateCcw,
  RefreshCw,
  Clock,
  UserCheck,
  ShieldAlert,
  Calendar,
} from "lucide-react";

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modals / prompt state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [showReverseModal, setShowReverseModal] = useState<boolean>(false);
  const [reverseReason, setReverseReason] = useState<string>("");

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getJournal(id);
      setJournal(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load journal entry details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeVariant = (status: JournalStatus) => {
    switch (status) {
      case "posted":
        return "success";
      case "approved":
        return "accent";
      case "pending_approval":
        return "warning";
      case "draft":
        return "muted";
      case "rejected":
      case "cancelled":
        return "danger";
      default:
        return "muted";
    }
  };

  // Actions
  const handleSubmit = async () => {
    if (!journal) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.submitJournal(journal.id);
      setJournal(updated);
      setActionMessage("Journal submitted for maker-checker approval.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit journal.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!journal) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.approveJournal(journal.id);
      setJournal(updated);
      setActionMessage("Journal successfully approved. It is now ready for posting.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve journal. Note: Maker cannot approve their own submission.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!journal) return;
    if (!rejectReason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.rejectJournal(journal.id, rejectReason.trim());
      setJournal(updated);
      setShowRejectModal(false);
      setRejectReason("");
      setActionMessage("Journal has been rejected.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reject journal.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!journal) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.cancelJournal(journal.id, cancelReason.trim());
      setJournal(updated);
      setShowCancelModal(false);
      setCancelReason("");
      setActionMessage("Journal has been cancelled.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel journal.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePost = async () => {
    if (!journal) return;
    if (!confirm(`Are you sure you want to POST journal ${journal.journal_number} to the General Ledger? This action is immutable.`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.postJournal(journal.id);
      setJournal(updated);
      setActionMessage("Journal successfully posted to the General Ledger!");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to post journal. Check operating currency approval and period lock status.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!journal) return;
    if (!reverseReason.trim()) {
      alert("A reversal reason is required.");
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const reversingJournal = await adminApi.reverseJournal(journal.id, reverseReason.trim());
      setShowReverseModal(false);
      setReverseReason("");
      setActionMessage(`Journal reversed successfully! Counter-reversal created: ${reversingJournal.journal_number}`);
      // Refresh current journal
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reverse journal entry.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !journal) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center py-20 text-gray-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading journal voucher...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/accounting/journals">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Journals
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-mono text-gray-900">
                {journal?.journal_number}
              </h1>
              {journal && (
                <Badge variant={getStatusBadgeVariant(journal.status)}>
                  {journal.status.replace("_", " ")}
                </Badge>
              )}
              {journal?.is_reversed && (
                <span className="px-2 py-0.5 text-xs rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  REVERSED
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              Type: <span className="font-semibold">{journal?.journal_type.replace("_", " ")}</span> | Date:{" "}
              <span className="font-semibold">{journal?.journal_date}</span> | Currency:{" "}
              <span className="font-semibold">{journal?.currency}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex items-center gap-2 flex-wrap">
          {journal?.status === "draft" && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="text-gray-600 hover:text-gray-900 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={actionLoading}
                className="gap-1.5 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for Approval
              </Button>
            </>
          )}

          {journal?.status === "pending_approval" && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={actionLoading}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Approve Voucher
              </Button>
            </>
          )}

          {journal?.status === "approved" && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePost}
                disabled={actionLoading}
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Post to General Ledger
              </Button>
            </>
          )}

          {journal?.status === "posted" && !journal.is_reversed && (
            <Button
              variant="secondary"
              onClick={() => setShowReverseModal(true)}
              disabled={actionLoading}
              className="gap-1.5 text-xs text-rose-600 hover:text-rose-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reverse Journal Entry
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

      {/* Header Info Card */}
      <Card className="p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accounting Period</p>
            <p className="font-semibold text-gray-900 mt-0.5">{journal?.accounting_period_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fiscal Year</p>
            <p className="font-semibold text-gray-900 mt-0.5">{journal?.fiscal_year_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">External Reference</p>
            <p className="font-semibold text-gray-900 font-mono mt-0.5">{journal?.reference || "None"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Equilibrium</p>
            <p className="font-bold text-gray-900 font-mono mt-0.5">
              {journal ? formatMoney(journal.total_debit) : "—"}
            </p>
          </div>
          <div className="md:col-span-4 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description / Memo</p>
            <p className="text-gray-800 mt-0.5">{journal?.description}</p>
          </div>
        </div>
      </Card>

      {/* Audit & Maker-Checker Timeline */}
      <Card className="p-5 shadow-sm bg-gray-50/50">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Governance & Audit Timeline
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-gray-500">Created By / At</p>
            <p className="font-semibold text-gray-800">{journal?.created_by_name || "System"}</p>
            <p className="text-gray-400">{journal?.created_at ? new Date(journal.created_at).toLocaleString() : "—"}</p>
          </div>

          <div>
            <p className="text-gray-500">Submitted By / At</p>
            <p className="font-semibold text-gray-800">{journal?.submitted_by_name || "—"}</p>
            <p className="text-gray-400">
              {journal?.submitted_at ? new Date(journal.submitted_at).toLocaleString() : "—"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Approved By / At</p>
            <p className="font-semibold text-gray-800">{journal?.approved_by_name || "—"}</p>
            <p className="text-gray-400">
              {journal?.approved_at ? new Date(journal.approved_at).toLocaleString() : "—"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Posted By / At</p>
            <p className="font-semibold text-gray-800">{journal?.posted_by_name || "—"}</p>
            <p className="text-gray-400">{journal?.posted_at ? new Date(journal.posted_at).toLocaleString() : "—"}</p>
          </div>
        </div>

        {/* Rejection / Cancellation Notes */}
        {journal?.rejection_reason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            <span className="font-semibold">Rejection Reason:</span> {journal.rejection_reason} (by{" "}
            {journal.rejected_by_name || "Reviewer"})
          </div>
        )}

        {journal?.cancellation_reason && (
          <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-800">
            <span className="font-semibold">Cancellation Reason:</span> {journal.cancellation_reason}
          </div>
        )}

        {/* Reversal Notes */}
        {journal?.is_reversed && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <span className="font-semibold">Reversal Notice:</span> This entry was reversed on{" "}
            {journal.reversed_at ? new Date(journal.reversed_at).toLocaleDateString() : ""} by{" "}
            {journal.reversed_by_name}. Reason: {journal.reversal_reason}
          </div>
        )}
      </Card>

      {/* Journal Lines Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Double-Entry Journal Lines</h3>
          <span className="text-xs text-gray-500 font-mono">
            {journal?.lines?.length || 0} line items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100/70 text-gray-600 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 text-left w-12">#</th>
                <th className="py-3 px-4 text-left">Account Code</th>
                <th className="py-3 px-4 text-left">Account Name</th>
                <th className="py-3 px-4 text-left">Line Memo</th>
                <th className="py-3 px-4 text-right w-44">Debit ({journal?.currency})</th>
                <th className="py-3 px-4 text-right w-44">Credit ({journal?.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {journal?.lines && journal.lines.length > 0 ? (
                journal.lines.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{l.line_number}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900 text-xs">
                      <Link href={`/accounting/chart-of-accounts/${l.account}`} className="text-blue-600 hover:underline">
                        {l.account_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{l.account_name}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{l.description || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-900">
                      {Number(l.debit) > 0 ? formatMoney(l.debit) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-900">
                      {Number(l.credit) > 0 ? formatMoney(l.credit) : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No lines found on this journal entry.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals */}
            <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right text-gray-700 text-xs uppercase tracking-wider">
                  Total Balanced Equilibrium:
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-900">
                  {journal ? formatMoney(journal.total_debit) : "0.00"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-900">
                  {journal ? formatMoney(journal.total_credit) : "0.00"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Reject Journal Voucher</h3>
            <p className="text-sm text-gray-500">
              Please specify the audit reason for rejecting journal {journal?.journal_number}. The submitter will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Inappropriate expense account classification..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Cancel Journal Entry</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to cancel journal {journal?.journal_number}?
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              placeholder="Reason for cancellation (optional)..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleCancel} disabled={actionLoading}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-lg font-bold text-gray-900">Reverse Journal Entry</h3>
            </div>
            <p className="text-sm text-gray-500">
              This will generate an immutable paired counter-reversal journal (swapping debits and credits) in the
              current open accounting period. A mandatory audit reason is required.
            </p>
            <textarea
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              rows={3}
              placeholder="Mandatory audit justification for reversing this posted voucher..."
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowReverseModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReverse}
                disabled={actionLoading || !reverseReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Post Counter-Reversal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

