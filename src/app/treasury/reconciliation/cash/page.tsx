"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CashCountReconciliation, FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Banknote,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Scale,
  ShieldAlert,
} from "lucide-react";

export default function CashReconciliationPage() {
  const [counts, setCounts] = useState<CashCountReconciliation[]>([]);
  const [cashAccounts, setCashAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Record Cash Count Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    cash_account_id: "",
    count_date: new Date().toISOString().split("T")[0],
    counted_amount: "",
    notes: "",
  });

  // Supervisory Review Modal
  const [reviewModal, setReviewModal] = useState<{
    action: "approve" | "reject";
    count: CashCountReconciliation;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [countRes, accRes] = await Promise.all([
        adminApi.getCashCountReconciliations(),
        adminApi.getFinancialAccounts({ account_type: "cash", is_active: true }),
      ]);
      setCounts(countRes);
      setCashAccounts(accRes);
      if (accRes.length > 0 && !formData.cash_account_id) {
        setFormData((prev) => ({ ...prev, cash_account_id: String(accRes[0].id) }));
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load cash count reconciliations.");
      }
    } finally {
      setLoading(false);
    }
  }, [formData.cash_account_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.cash_account_id || !formData.counted_amount) {
        setError("Cash account and physical counted amount are required.");
        return;
      }

      await adminApi.recordCashCount({
        cash_account: parseInt(formData.cash_account_id, 10),
        count_date: formData.count_date,
        counted_amount: formData.counted_amount,
        notes: formData.notes,
      });

      setSuccessMsg("Physical cash count submitted for supervisory review.");
      setShowModal(false);
      setFormData({
        cash_account_id: cashAccounts.length > 0 ? String(cashAccounts[0].id) : "",
        count_date: new Date().toISOString().split("T")[0],
        counted_amount: "",
        notes: "",
      });
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to record physical cash count.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteReview = async () => {
    if (!reviewModal) return;
    try {
      setReviewSubmitting(true);
      setError(null);

      await adminApi.reviewCashCount(
        reviewModal.count.id,
        reviewModal.action,
        reviewNotes
      );

      setSuccessMsg(
        `Cash count ${reviewModal.count.reconciliation_number} ${reviewModal.action}d successfully.`
      );
      setReviewModal(null);
      setReviewNotes("");
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError(`Failed to ${reviewModal.action} cash count.`);
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const filteredCounts = counts.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = c.reconciliation_number.toLowerCase().includes(q);
      const matchAcc = (c.cash_account_name || "").toLowerCase().includes(q) || (c.cash_account_code || "").toLowerCase().includes(q);
      if (!matchNum && !matchAcc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: CashCountReconciliation["status"]) => {
    switch (status) {
      case "submitted":
        return <Badge variant="warning">Submitted (Awaiting Review)</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const selectedCashAccount = cashAccounts.find(
    (a) => String(a.id) === formData.cash_account_id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Physical Cash & Safe Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conduct daily physical cash counts across POS counter drawers and vault safes with maker-checker variance verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Record Physical Count
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success">
          {successMsg}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Cash Counts</p>
            <p className="text-xl font-bold text-foreground">{counts.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Awaiting Supervisory Review</p>
            <p className="text-xl font-bold text-foreground">
              {counts.filter((c) => c.status === "submitted").length}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Discrepancy Flags</p>
            <p className="text-xl font-bold text-foreground">
              {counts.filter((c) => parseFloat(c.difference || "0") !== 0).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by count #, cash account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-44"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted (Pending Review)</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Counts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Count #</th>
                <th className="py-3 px-4">Cash Drawer / Safe</th>
                <th className="py-3 px-4">Count Date</th>
                <th className="py-3 px-4 text-right">Expected (Book)</th>
                <th className="py-3 px-4 text-right">Physical Count</th>
                <th className="py-3 px-4 text-right">Difference</th>
                <th className="py-3 px-4">Counted By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground font-sans">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading physical cash counts...
                  </td>
                </tr>
              ) : filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground font-sans">
                    No physical cash count records found.
                  </td>
                </tr>
              ) : (
                filteredCounts.map((cnt) => {
                  const diff = parseFloat(cnt.difference || "0");
                  return (
                    <tr key={cnt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {cnt.reconciliation_number}
                      </td>
                      <td className="py-3 px-4 font-sans text-sm">
                        <div className="font-medium text-foreground">{cnt.cash_account_name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{cnt.cash_account_code}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {cnt.count_date}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-muted-foreground">
                        ৳{parseFloat(cnt.expected_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        ৳{parseFloat(cnt.counted_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          diff === 0
                            ? "text-emerald-600"
                            : diff > 0
                            ? "text-blue-600"
                            : "text-rose-600"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}৳
                        {diff.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-sans text-muted-foreground">
                        {cnt.counted_by_username || "System"}
                      </td>
                      <td className="py-3 px-4 font-sans">{getStatusBadge(cnt.status)}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        {cnt.status === "submitted" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setReviewModal({ action: "approve", count: cnt })}
                              title="Supervisor Approve"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setReviewModal({ action: "reject", count: cnt })}
                              title="Supervisor Reject"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {cnt.status !== "submitted" && (
                          <span className="text-xs text-muted-foreground">
                            Reviewed by {cnt.reviewed_by_username || "Supervisor"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Cash Count Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Record Physical Cash Count
            </h2>
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Cash Drawer / Vault Safe <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.cash_account_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cash_account_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {cashAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) — Book Balance: ৳
                      {parseFloat(acc.current_balance).toLocaleString("en-BD", {
                        minimumFractionDigits: 2,
                      })}
                    </option>
                  ))}
                </select>
                {selectedCashAccount && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    System Book Balance: ৳
                    {parseFloat(selectedCashAccount.current_balance).toLocaleString("en-BD", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Count Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.count_date}
                  onChange={(e) => setFormData({ ...formData, count_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Physical Counted Amount (BDT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.counted_amount}
                  onChange={(e) => setFormData({ ...formData, counted_amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-base font-semibold"
                />
                {selectedCashAccount && formData.counted_amount && (
                  <div className="mt-1 text-xs">
                    {(() => {
                      const book = parseFloat(selectedCashAccount.current_balance || "0");
                      const counted = parseFloat(formData.counted_amount || "0");
                      const diff = counted - book;
                      return (
                        <span
                          className={`font-semibold ${
                            diff === 0
                              ? "text-emerald-600"
                              : diff > 0
                              ? "text-blue-600"
                              : "text-rose-600"
                          }`}
                        >
                          Variance: {diff > 0 ? "+" : ""}৳
                          {diff.toLocaleString("en-BD", { minimumFractionDigits: 2 })}{" "}
                          ({diff === 0 ? "Exact Match" : diff > 0 ? "Overage" : "Shortage"})
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Count notes or explanation of any variance..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Review"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              {reviewModal.action === "approve" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Approve Physical Cash Count
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-600" />
                  Reject Physical Cash Count
                </>
              )}
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              Reviewing count {reviewModal.count.reconciliation_number} on drawer{" "}
              {reviewModal.count.cash_account_name}. Counted: ৳
              {parseFloat(reviewModal.count.counted_amount).toLocaleString("en-BD", {
                minimumFractionDigits: 2,
              })}{" "}
              (Variance: ৳
              {parseFloat(reviewModal.count.difference).toLocaleString("en-BD", {
                minimumFractionDigits: 2,
              })}
              ).
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Supervisor Remarks
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Audit observation or approval notes..."
                className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setReviewModal(null);
                  setReviewNotes("");
                }}
                disabled={reviewSubmitting}
              >
                Back
              </Button>
              <Button
                variant={reviewModal.action === "approve" ? "primary" : "danger"}
                onClick={handleExecuteReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : reviewModal.action === "approve" ? (
                  "Confirm Approval"
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
