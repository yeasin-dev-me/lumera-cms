"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseVoucher } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CheckSquare,
  Clock,
  Eye,
  RefreshCw,
  ArrowLeft,
  X,
  AlertCircle,
} from "lucide-react";

export default function ExpenseApprovalsQueuePage() {
  const [vouchers, setVouchers] = useState<ExpenseVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reject Modal
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [submittingReject, setSubmittingReject] = useState<boolean>(false);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getExpenseVouchers({ status: "pending_approval" });
      setVouchers(res.results || []);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load approvals queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleApprove = async (voucher: ExpenseVoucher) => {
    if (!confirm(`Are you sure you want to approve voucher ${voucher.voucher_number} for ${formatMoney(voucher.amount)}?`)) {
      return;
    }
    try {
      setError(null);
      setSuccessMsg(null);
      await adminApi.approveExpenseVoucher(voucher.id);
      setSuccessMsg(`Voucher ${voucher.voucher_number} approved successfully.`);
      await loadQueue();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Approval failed.");
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      setSubmittingReject(true);
      setError(null);
      setSuccessMsg(null);
      await adminApi.rejectExpenseVoucher(rejectingId, rejectReason);
      setSuccessMsg("Voucher has been rejected.");
      setRejectingId(null);
      setRejectReason("");
      await loadQueue();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Rejection failed.");
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/expenses" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Expenses
            </Link>
            <span>/</span>
            <span>Approvals</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Managerial Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maker-Checker underwriting inbox for submitted operating vouchers awaiting sign-off
          </p>
        </div>
        <Button variant="secondary" onClick={loadQueue} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Queue
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Voucher Number</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Requested By</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Category & Payee</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Attachments</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Decision Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading approval queue...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <CheckSquare className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                    All clear! No vouchers currently awaiting managerial approval.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">
                      <Link href={`/expenses/vouchers/${v.id}`} className="hover:underline">
                        {v.voucher_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{v.expense_date}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 font-medium">{v.requested_by_name}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{v.payee_name}</div>
                      <div className="text-xs text-gray-500">{v.category_name}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(v.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={v.attachment_count && v.attachment_count > 0 ? "primary" : "muted"}>
                        {v.attachment_count ?? 0} file(s)
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/expenses/vouchers/${v.id}`}>
                          <Button variant="ghost" size="sm" title="Inspect Voucher">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setRejectingId(v.id);
                            setRejectReason("");
                          }}
                          className="text-red-600 text-xs"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(v)}
                          className="text-xs"
                        >
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Reject Voucher</h3>
              <button type="button" onClick={() => setRejectingId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Managerial Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide justification for rejecting this voucher..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setRejectingId(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={submittingReject}>
                  {submittingReject ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

