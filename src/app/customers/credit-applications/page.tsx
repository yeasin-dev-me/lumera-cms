"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CustomerProfile } from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CreditCard,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Loader2,
  X,
  FileCheck,
} from "lucide-react";

export default function CreditApplicationsPage() {
  const [applications, setApplications] = useState<CustomerProfile[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Approve Modal State
  const [approveProfile, setApproveProfile] = useState<CustomerProfile | null>(null);
  const [approvedLimit, setApprovedLimit] = useState<string>("");
  const [approvedTerms, setApprovedTerms] = useState<string>("");
  const [approveNotes, setApproveNotes] = useState<string>("");
  const [submittingApprove, setSubmittingApprove] = useState<boolean>(false);

  // Reject Modal State
  const [rejectProfile, setRejectProfile] = useState<CustomerProfile | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [submittingReject, setSubmittingReject] = useState<boolean>(false);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPendingCreditApplications({
        page,
        page_size: pageSize,
      });
      setApplications(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load credit applications.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const openApproveModal = (prof: CustomerProfile) => {
    setApproveProfile(prof);
    setApprovedLimit(prof.credit_limit || "0.00");
    setApprovedTerms(String(prof.payment_terms_days || 30));
    setApproveNotes("");
  };

  const closeApproveModal = () => {
    setApproveProfile(null);
    setApprovedLimit("");
    setApprovedTerms("");
    setApproveNotes("");
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveProfile) return;

    try {
      setSubmittingApprove(true);
      setError(null);
      await adminApi.approveCustomerCredit(approveProfile.id, {
        approved_limit: approvedLimit,
        payment_terms_days: parseInt(approvedTerms, 10) || 30,
        notes: approveNotes,
      });
      setSuccessMsg(`Credit application approved for ${approveProfile.display_name}. Limit: ৳${approvedLimit}`);
      closeApproveModal();
      loadApplications();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve credit application.");
      }
    } finally {
      setSubmittingApprove(false);
    }
  };

  const openRejectModal = (prof: CustomerProfile) => {
    setRejectProfile(prof);
    setRejectReason("");
  };

  const closeRejectModal = () => {
    setRejectProfile(null);
    setRejectReason("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectProfile) return;

    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejecting the credit application.");
      return;
    }

    try {
      setSubmittingReject(true);
      setError(null);
      await adminApi.rejectCustomerCredit(rejectProfile.id, rejectReason.trim());
      setSuccessMsg(`Credit application rejected for ${rejectProfile.display_name}.`);
      closeRejectModal();
      loadApplications();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reject credit application.");
      }
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Wholesale Credit Applications
            </h1>
            <Badge variant="warning">
              <Clock className="w-3 h-3 mr-1" />
              {totalCount} Pending
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Maker-checker credit underwriting pipeline for wholesale and corporate commercial accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/customers">
            <Button variant="secondary" size="sm">
              Customer Directory
            </Button>
          </Link>
          <Link href="/customers/receivables">
            <Button variant="secondary" size="sm">
              Receivables Dashboard
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadApplications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-900 space-y-1">
          <p className="font-medium">Strict Maker-Checker Credit Governance Enforced</p>
          <p className="text-amber-800 text-xs leading-relaxed">
            Credit limits can only be approved by authorized credit approvers (`customers.credit_approve`).
            The applicant staff member cannot self-approve. Approvals must be in operating currency (BDT)
            and will immediately enable credit ceiling validation across wholesale invoicing.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Queue Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Pending Underwriting Queue ({totalCount})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm">Loading credit applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-base font-medium text-gray-700">All clear!</p>
            <p className="text-sm text-gray-500">There are no pending credit applications awaiting approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer / Business</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Requested Limit</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4">Trade License / Documents</th>
                  <th className="py-3 px-4">Application Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((prof) => (
                  <tr key={prof.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{prof.display_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {prof.business_name || "Individual"}
                      </div>
                      <div className="text-xs text-gray-400">{prof.user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="muted" className="capitalize">
                        {prof.customer_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      ৳{parseFloat(prof.credit_limit || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {prof.payment_terms_days} days
                    </td>
                    <td className="py-3 px-4">
                      {prof.trade_license_document ? (
                        <a
                          href={prof.trade_license_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          View Document
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None attached</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-xs text-gray-600" title={prof.credit_notes}>
                      {prof.credit_notes || <span className="text-gray-400 italic">No notes provided</span>}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openApproveModal(prof)}
                        className="text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openRejectModal(prof)}
                        className="text-rose-700 hover:bg-rose-50 border-rose-200"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        Reject
                      </Button>
                      <Link href={`/customers/${prof.id}`}>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Approve Modal */}
      {approveProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">Approve Wholesale Credit</h3>
              </div>
              <button
                type="button"
                onClick={closeApproveModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-gray-800">{approveProfile.display_name}</p>
              <p className="text-gray-600">Business: {approveProfile.business_name || "Individual"}</p>
              <p className="text-gray-600">Tax ID: {approveProfile.tax_identifier || "None"}</p>
              <p className="text-gray-500">Requested Limit: ৳{approveProfile.credit_limit} | Terms: {approveProfile.payment_terms_days} days</p>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Approved Credit Limit (৳ BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={approvedLimit}
                  onChange={(e) => setApprovedLimit(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Approved Payment Terms (Days) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="365"
                  required
                  value={approvedTerms}
                  onChange={(e) => setApprovedTerms(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">Default payment due period for issued sales invoices.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Approval Notes / Underwriting Memo (Optional)
                </label>
                <textarea
                  rows={3}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Record commercial rationale, credit check findings, collateral, or guarantor notes..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeApproveModal}
                  disabled={submittingApprove}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submittingApprove ? "Approving..." : "Confirm Credit Approval"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-gray-900">Reject Credit Application</h3>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-gray-800">{rejectProfile.display_name}</p>
              <p className="text-gray-600">Business: {rejectProfile.business_name || "Individual"}</p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why the credit application was rejected (e.g., incomplete trade license, unsatisfactory credit assessment, high default risk)..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeRejectModal}
                  disabled={submittingReject}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReject}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {submittingReject ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
