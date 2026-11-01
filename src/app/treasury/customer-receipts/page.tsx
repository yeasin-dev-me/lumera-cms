"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CustomerReceipt, FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Wallet,
  Calendar,
  Search,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function CustomerReceiptsPage() {
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Record Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    account_id: "",
    amount: "",
    payment_method: "bank_transfer",
    receipt_date: new Date().toISOString().split("T")[0],
    external_reference: "",
    notes: "",
  });

  // Action Confirmation / Reason Modal
  const [actionModal, setActionModal] = useState<{
    type: "verify" | "cancel" | "reverse";
    receipt: CustomerReceipt;
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recRes, accRes, custRes] = await Promise.all([
        adminApi.getCustomerReceipts(),
        adminApi.getFinancialAccounts({ is_active: true }),
        adminApi.getCustomerProfiles().catch(() => ({ results: [] })),
      ]);
      setReceipts(recRes);
      setAccounts(accRes);
      setCustomers(custRes.results || []);
      if (accRes.length > 0 && !formData.account_id) {
        setFormData((prev) => ({ ...prev, account_id: String(accRes[0].id) }));
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load customer receipts.");
      }
    } finally {
      setLoading(false);
    }
  }, [formData.account_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.customer_id || !formData.account_id || !formData.amount) {
        setError("Customer, financial account, and receipt amount are required.");
        return;
      }

      await adminApi.createCustomerReceipt({
        customer: parseInt(formData.customer_id, 10),
        financial_account: parseInt(formData.account_id, 10),
        amount: formData.amount,
        payment_method: formData.payment_method,
        receipt_date: formData.receipt_date,
        external_reference: formData.external_reference,
        notes: formData.notes,
      });

      setSuccessMsg("Customer receipt recorded successfully.");
      setShowModal(false);
      setFormData({
        customer_id: "",
        account_id: accounts.length > 0 ? String(accounts[0].id) : "",
        amount: "",
        payment_method: "bank_transfer",
        receipt_date: new Date().toISOString().split("T")[0],
        external_reference: "",
        notes: "",
      });
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to record receipt.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    try {
      setActionSubmitting(true);
      setError(null);

      if (actionModal.type === "verify") {
        await adminApi.verifyCustomerReceipt(actionModal.receipt.id);
        setSuccessMsg(`Receipt ${actionModal.receipt.receipt_number} verified and posted to ledgers.`);
      } else if (actionModal.type === "cancel") {
        if (!actionReason.trim()) {
          setError("Cancellation reason is required.");
          return;
        }
        await adminApi.cancelCustomerReceipt(actionModal.receipt.id, actionReason);
        setSuccessMsg(`Receipt ${actionModal.receipt.receipt_number} cancelled.`);
      } else if (actionModal.type === "reverse") {
        if (!actionReason.trim()) {
          setError("Reversal reason is required.");
          return;
        }
        await adminApi.reverseCustomerReceipt(actionModal.receipt.id, actionReason);
        setSuccessMsg(`Receipt ${actionModal.receipt.receipt_number} reversed with contra-entries.`);
      }

      setActionModal(null);
      setActionReason("");
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError(`Failed to ${actionModal.type} receipt.`);
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.receipt_number.toLowerCase().includes(q);
      const matchCust = (r.customer_name || "").toLowerCase().includes(q) || (r.customer_code || "").toLowerCase().includes(q);
      const matchRef = (r.external_reference || "").toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchRef) return false;
    }
    return true;
  });

  const getStatusBadge = (status: CustomerReceipt["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="warning">Draft</Badge>;
      case "verified":
        return <Badge variant="success">Verified</Badge>;
      case "cancelled":
        return <Badge variant="muted">Cancelled</Badge>;
      case "reversed":
        return <Badge variant="danger">Reversed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const totalVerifiedAmount = receipts
    .filter((r) => r.status === "verified")
    .reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);

  const pendingVerificationCount = receipts.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Customer Receipts & Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Collect customer settlements into treasury accounts and synchronize customer subledger credits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Record Receipt
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
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Receipts</p>
            <p className="text-xl font-bold text-foreground">{receipts.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Verified Collections</p>
            <p className="text-xl font-bold text-foreground">
              ৳{totalVerifiedAmount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pending Verification</p>
            <p className="text-xl font-bold text-foreground">{pendingVerificationCount}</p>
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
              placeholder="Search by receipt #, customer, reference..."
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
              <option value="draft">Draft (Pending Verification)</option>
              <option value="verified">Verified (Posted)</option>
              <option value="cancelled">Cancelled</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Receipts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method / Ref</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading customer receipts...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No customer receipts found.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rcpt) => (
                  <tr key={rcpt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {rcpt.receipt_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{rcpt.customer_name || "N/A"}</div>
                      {rcpt.customer_code && (
                        <div className="text-xs text-muted-foreground">{rcpt.customer_code}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{rcpt.account_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{rcpt.account_code}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {rcpt.receipt_date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="capitalize text-foreground font-medium">
                        {rcpt.payment_method.replace(/_/g, " ")}
                      </div>
                      {rcpt.external_reference && (
                        <div className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                          Ref: {rcpt.external_reference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                      +৳{parseFloat(rcpt.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(rcpt.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rcpt.status === "draft" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setActionModal({ type: "verify", receipt: rcpt })}
                              title="Verify & Post to Ledgers"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setActionModal({ type: "cancel", receipt: rcpt })}
                              title="Cancel Receipt"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {rcpt.status === "verified" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setActionModal({ type: "reverse", receipt: rcpt })}
                            title="Reverse with Contra-Entry"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reverse
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Record Customer Receipt
            </h2>
            <form onSubmit={handleRecordReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name ? `${c.company_name} (${c.display_name || c.user?.username})` : (c.display_name || c.user?.username)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Deposit Into Financial Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) — Balance: ৳{parseFloat(acc.current_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Amount (BDT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Receipt Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.receipt_date}
                    onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="bank_transfer">Bank Transfer / EFT</option>
                    <option value="cash">Cash Tender</option>
                    <option value="cheque">Cheque</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="pos_card">POS Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    External Reference
                  </label>
                  <input
                    type="text"
                    value={formData.external_reference}
                    onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                    placeholder="Cheque # / TrxID / Ref"
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional settlement remarks..."
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
                      Recording...
                    </>
                  ) : (
                    "Record Receipt"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Action / Reversal Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              {actionModal.type === "verify" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Verify Customer Receipt
                </>
              ) : actionModal.type === "cancel" ? (
                <>
                  <XCircle className="h-5 w-5 text-rose-600" />
                  Cancel Customer Receipt
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Reverse Customer Receipt
                </>
              )}
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              {actionModal.type === "verify"
                ? `Confirm receipt ${actionModal.receipt.receipt_number} of ৳${parseFloat(actionModal.receipt.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}. This will post an inflow into ${actionModal.receipt.account_name} and credit customer ${actionModal.receipt.customer_name}.`
                : actionModal.type === "cancel"
                ? `Are you sure you want to cancel draft receipt ${actionModal.receipt.receipt_number}? No financial entries will be created.`
                : `Reversing receipt ${actionModal.receipt.receipt_number} will create an offsetting outflow transaction in ${actionModal.receipt.account_name} and a contra debit in the customer ledger.`}
            </p>

            {(actionModal.type === "cancel" || actionModal.type === "reverse") && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="State the audit reason for this action..."
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setActionModal(null);
                  setActionReason("");
                }}
                disabled={actionSubmitting}
              >
                Back
              </Button>
              <Button
                variant={
                  actionModal.type === "cancel"
                    ? "danger"
                    : actionModal.type === "reverse"
                    ? "secondary"
                    : "primary"
                }
                onClick={handleExecuteAction}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : actionModal.type === "verify" ? (
                  "Confirm & Post"
                ) : actionModal.type === "cancel" ? (
                  "Confirm Cancellation"
                ) : (
                  "Confirm Reversal"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
