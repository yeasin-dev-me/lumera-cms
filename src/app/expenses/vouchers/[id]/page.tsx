"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseVoucher, ExpenseVoucherStatus } from "@/types/expenses";
import { FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  XCircle,
  CreditCard,
  Upload,
  FileText,
  Clock,
  User,
  Building2,
  Trash2,
  X,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function ExpenseVoucherDetailPage() {
  const params = useParams();
  const voucherId = params.id as string;

  const [voucher, setVoucher] = useState<ExpenseVoucher | null>(null);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Disbursement Modal
  const [isDisburseOpen, setIsDisburseOpen] = useState<boolean>(false);
  const [disburseForm, setDisburseForm] = useState({
    financial_account_id: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });
  const [disbursing, setDisbursing] = useState<boolean>(false);

  // Reject Modal
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejecting, setRejecting] = useState<boolean>(false);

  // Attachment Upload
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("receipt");
  const [uploadDesc, setUploadDesc] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  const loadVoucher = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [v, accs] = await Promise.all([
        adminApi.getExpenseVoucher(voucherId),
        adminApi.getFinancialAccounts({ is_active: true }),
      ]);
      setVoucher(v);
      setFinancialAccounts(accs);
      setDisburseForm((prev) => ({
        ...prev,
        amount: v.remaining_amount,
        financial_account_id: accs.length > 0 ? String(accs[0].id) : "",
      }));
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load expense voucher details.");
      }
    } finally {
      setLoading(false);
    }
  }, [voucherId]);

  useEffect(() => {
    loadVoucher();
  }, [loadVoucher]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmitForApproval = async () => {
    try {
      setError(null);
      await adminApi.submitExpenseVoucher(voucherId);
      setSuccessMsg("Voucher submitted for managerial approval.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to submit voucher.");
    }
  };

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this expense voucher?")) return;
    try {
      setError(null);
      await adminApi.approveExpenseVoucher(voucherId);
      setSuccessMsg("Voucher approved successfully.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to approve voucher.");
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRejecting(true);
      setError(null);
      await adminApi.rejectExpenseVoucher(voucherId, rejectReason);
      setIsRejectOpen(false);
      setSuccessMsg("Voucher has been rejected.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to reject voucher.");
    } finally {
      setRejecting(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt("Enter reason for cancellation:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.cancelExpenseVoucher(voucherId, reason);
      setSuccessMsg("Voucher cancelled.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to cancel voucher.");
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDisbursing(true);
      setError(null);
      await adminApi.disburseExpenseVoucher(voucherId, {
        financial_account_id: Number(disburseForm.financial_account_id),
        amount: disburseForm.amount,
        payment_method: disburseForm.payment_method,
        reference_number: disburseForm.reference_number,
        notes: disburseForm.notes,
      });
      setIsDisburseOpen(false);
      setSuccessMsg("Expense disbursement completed via Treasury.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Disbursement failed.");
    } finally {
      setDisbursing(false);
    }
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      setUploading(true);
      setError(null);
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("document_type", documentType);
      fd.append("description", uploadDesc);
      await adminApi.uploadVoucherAttachment(voucherId, fd);
      setIsUploadOpen(false);
      setUploadFile(null);
      setSuccessMsg("Attachment uploaded.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attId: number) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return;
    try {
      setError(null);
      await adminApi.deleteVoucherAttachment(voucherId, attId);
      setSuccessMsg("Attachment removed.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to remove attachment.");
    }
  };

  const handleReverseDisbursement = async (disbId: number) => {
    const reason = prompt("Enter reason for reversing this disbursement:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.reverseExpenseDisbursement(disbId, reason);
      setSuccessMsg("Disbursement reversed. Funds restored to Treasury.");
      await loadVoucher();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to reverse disbursement.");
    }
  };

  if (loading && !voucher) {
    return <div className="p-8 text-center text-gray-500">Loading voucher details...</div>;
  }

  if (!voucher) {
    return (
      <div className="p-8 text-center text-red-500">
        Voucher not found. <Link href="/expenses/vouchers" className="underline">Back to list</Link>
      </div>
    );
  }

  const categoryName = typeof voucher.category === "object" ? voucher.category.name : voucher.category_name;
  const categoryCode = typeof voucher.category === "object" ? voucher.category.code : voucher.category_code;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/expenses/vouchers" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> All Vouchers
            </Link>
            <span>/</span>
            <span className="font-mono">{voucher.voucher_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{voucher.voucher_number}</h1>
            <Badge
              variant={
                voucher.status === "paid"
                  ? "success"
                  : voucher.status === "partially_paid"
                  ? "accent"
                  : voucher.status === "approved"
                  ? "primary"
                  : voucher.status === "pending_approval"
                  ? "warning"
                  : voucher.status === "rejected"
                  ? "danger"
                  : "muted"
              }
            >
              {voucher.status_display}
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {voucher.status === "draft" && (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel Voucher
              </Button>
              <Button variant="primary" onClick={handleSubmitForApproval}>
                Submit for Approval
              </Button>
            </>
          )}

          {voucher.status === "pending_approval" && (
            <>
              <Button variant="danger" onClick={() => setIsRejectOpen(true)}>
                Reject
              </Button>
              <Button variant="primary" onClick={handleApprove}>
                Approve Voucher
              </Button>
            </>
          )}

          {(voucher.status === "approved" || voucher.status === "partially_paid") && (
            <>
              {voucher.status === "approved" && (
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel Voucher
                </Button>
              )}
              <Button variant="primary" onClick={() => setIsDisburseOpen(true)} className="gap-2">
                <CreditCard className="h-4 w-4" />
                Disburse Payout
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Main Grid: Details & Side Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Voucher Metadata & Disbursements */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-base border-b pb-3 flex items-center justify-between">
              <span>Expenditure Information</span>
              <span className="text-xs text-gray-500 font-normal">Date: {voucher.expense_date}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Payee / Vendor</p>
                <p className="font-semibold text-gray-900 mt-0.5">{voucher.payee_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Expense Category</p>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {categoryName} <span className="font-mono text-xs text-gray-500">({categoryCode})</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">External Invoice / Ref #</p>
                <p className="font-mono text-gray-900 mt-0.5">{voucher.reference_number || "—"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Operating Currency</p>
                <p className="font-semibold text-gray-900 mt-0.5">{voucher.currency}</p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500">Purpose & Justification</p>
                <p className="text-gray-800 mt-0.5 bg-gray-50 p-3 rounded-lg border">{voucher.description}</p>
              </div>

              {voucher.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Internal Remarks</p>
                  <p className="text-gray-700 mt-0.5 italic">{voucher.notes}</p>
                </div>
              )}

              {voucher.rejection_reason && (
                <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                  <p className="text-sm text-red-900 mt-0.5">{voucher.rejection_reason}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Disbursements History */}
          <Card className="p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-base mb-4 flex items-center justify-between">
              <span>Treasury Disbursements</span>
              <span className="text-xs text-gray-500 font-normal">
                {voucher.disbursements?.length || 0} payout record(s)
              </span>
            </h3>

            {!voucher.disbursements || voucher.disbursements.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No disbursements recorded yet for this voucher.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Disb #</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Treasury Account</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Amount</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {voucher.disbursements.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-blue-700">
                          {d.disbursement_number}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{d.disbursement_date}</td>
                        <td className="px-3 py-2 text-xs">
                          <span className="font-medium text-gray-900">{d.financial_account_name}</span>
                          <span className="font-mono text-gray-400 text-[10px] ml-1">({d.financial_account_code})</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {formatMoney(d.amount)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {d.status === "completed" ? (
                            <Badge variant="success">Completed</Badge>
                          ) : (
                            <Badge variant="muted">Reversed</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {d.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReverseDisbursement(d.id)}
                              className="text-red-600 gap-1 text-xs"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reverse
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Supporting Attachments */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-base">Receipts & Documentation</h3>
              {voucher.status !== "cancelled" && (
                <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(true)} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Attachment
                </Button>
              )}
            </div>

            {!voucher.attachments || voucher.attachments.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No supporting documents attached. Upload receipts or vendor invoices for audit compliance.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voucher.attachments.map((att) => (
                  <div key={att.id} className="p-3 border rounded-lg flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div className="truncate">
                        <a
                          href={att.file}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-xs text-blue-700 hover:underline truncate block"
                        >
                          {att.original_filename}
                        </a>
                        <p className="text-[10px] text-gray-500">
                          {att.document_type_display} &bull; {(att.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    {voucher.status !== "paid" && voucher.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete attachment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Balance Breakdown & Maker-Checker Timeline */}
        <div className="space-y-6">
          <Card className="p-5 shadow-sm space-y-4 bg-slate-50 border-slate-200">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Financial Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Authorized Billed:</span>
                <span className="font-bold text-gray-900">{formatMoney(voucher.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Disbursed (Paid):</span>
                <span className="font-bold text-emerald-700">{formatMoney(voucher.paid_amount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium text-gray-700">Remaining Payable:</span>
                <span className="font-bold text-amber-700">{formatMoney(voucher.remaining_amount)}</span>
              </div>
            </div>
          </Card>

          {/* Maker-Checker Audit Trail */}
          <Card className="p-5 shadow-sm space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-500" />
              Governance & Audit Trail
            </h4>

            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-semibold text-gray-900">1. Draft Requested</p>
                <p className="text-gray-500">By: {voucher.requested_by_name}</p>
                <p className="text-gray-400">{voucher.created_at?.split("T")[0]}</p>
              </div>

              {voucher.submitted_at && (
                <div className="border-l-2 border-amber-500 pl-3">
                  <p className="font-semibold text-gray-900">2. Submitted for Approval</p>
                  <p className="text-gray-400">{voucher.submitted_at?.split("T")[0]}</p>
                </div>
              )}

              {voucher.approved_at && (
                <div className="border-l-2 border-emerald-500 pl-3">
                  <p className="font-semibold text-gray-900">3. Approved</p>
                  <p className="text-gray-500">By: {voucher.approved_by_name}</p>
                  <p className="text-gray-400">{voucher.approved_at?.split("T")[0]}</p>
                </div>
              )}

              {voucher.rejected_at && (
                <div className="border-l-2 border-red-500 pl-3">
                  <p className="font-semibold text-gray-900">Rejected</p>
                  <p className="text-gray-500">By: {voucher.rejected_by_name}</p>
                  <p className="text-gray-400">{voucher.rejected_at?.split("T")[0]}</p>
                </div>
              )}

              {voucher.cancelled_at && (
                <div className="border-l-2 border-gray-400 pl-3">
                  <p className="font-semibold text-gray-900">Cancelled</p>
                  <p className="text-gray-500">By: {voucher.cancelled_by_name}</p>
                  <p className="text-gray-400">{voucher.cancelled_at?.split("T")[0]}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Disburse Modal */}
      {isDisburseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Record Treasury Disbursement</h3>
              <button type="button" onClick={() => setIsDisburseOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Source Treasury Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={disburseForm.financial_account_id}
                  onChange={(e) => setDisburseForm({ ...disburseForm, financial_account_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                >
                  <option value="">— Select Account —</option>
                  {financialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) - {acc.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Disbursement Amount (Max: {formatMoney(voucher.remaining_amount)}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={voucher.remaining_amount}
                  required
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={disburseForm.payment_method}
                  onChange={(e) => setDisburseForm({ ...disburseForm, payment_method: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                >
                  <option value="cash">Cash Tender</option>
                  <option value="bank_transfer">Bank Transfer (BEFTN/RTGS)</option>
                  <option value="bkash">bKash Merchant</option>
                  <option value="nagad">Nagad Merchant</option>
                  <option value="cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cheque / Voucher Ref #</label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-890214"
                  value={disburseForm.reference_number}
                  onChange={(e) => setDisburseForm({ ...disburseForm, reference_number: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsDisburseOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={disbursing}>
                  {disbursing ? "Disbursing..." : "Confirm Payout"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Reject Expense Voucher</h3>
              <button type="button" onClick={() => setIsRejectOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                  placeholder="Explain why this voucher is rejected (e.g. Missing receipts, outside quarterly budget)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsRejectOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={rejecting}>
                  {rejecting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Upload Supporting Document</h3>
              <button type="button" onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadAttachment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select File (PDF, PNG, JPG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Document Classification</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                >
                  <option value="receipt">Cash / Counter Receipt</option>
                  <option value="invoice">Vendor Tax / Sales Invoice</option>
                  <option value="bill">Utility / Service Bill</option>
                  <option value="payment_evidence">Payment Evidence / Slip</option>
                  <option value="other">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Scanned receipt from hardware store"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

