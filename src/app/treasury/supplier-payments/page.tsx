"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SupplierDisbursement, FinancialAccount } from "@/types/treasury";
import { Supplier, PurchaseBill } from "@/types/procurement";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CreditCard,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Search,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SupplierPaymentsPage() {
  const [disbursements, setDisbursements] = useState<SupplierDisbursement[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Create Disbursement Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [availableBills, setAvailableBills] = useState<PurchaseBill[]>([]);
  const [loadingBills, setLoadingBills] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    supplier_id: "",
    account_id: "",
    amount: "",
    disbursement_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    external_reference: "",
    notes: "",
    allocations: [] as { purchase_bill_id: number; allocated_amount: string; bill_number: string; total: string }[],
  });

  // Action Confirmation Modal
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "complete" | "reject" | "reverse";
    disbursement: SupplierDisbursement;
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [disbRes, accRes, suppRes] = await Promise.all([
        adminApi.getSupplierDisbursements(),
        adminApi.getFinancialAccounts({ is_active: true }),
        adminApi.getSuppliers({ is_active: true }).catch(() => ({ results: [] })),
      ]);
      setDisbursements(disbRes);
      setAccounts(accRes);
      setSuppliers(suppRes.results || []);
      if (accRes.length > 0 && !formData.account_id) {
        setFormData((prev) => ({ ...prev, account_id: String(accRes[0].id) }));
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load supplier disbursements.");
      }
    } finally {
      setLoading(false);
    }
  }, [formData.account_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When supplier changes in modal, load unallocated/posted purchase bills for that supplier
  const handleSupplierChange = async (supplierId: string) => {
    setFormData((prev) => ({ ...prev, supplier_id: supplierId, allocations: [] }));
    if (!supplierId) {
      setAvailableBills([]);
      return;
    }
    try {
      setLoadingBills(true);
      const bills = await adminApi.getPurchaseBills({ supplier_id: supplierId, status: "posted" });
      setAvailableBills(bills.results || []);
    } catch {
      setAvailableBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleAddBillAllocation = (bill: PurchaseBill) => {
    if (formData.allocations.some((a) => a.purchase_bill_id === bill.id)) return;
    setFormData((prev) => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        {
          purchase_bill_id: bill.id,
          allocated_amount: bill.total_amount,
          bill_number: bill.bill_number,
          total: bill.total_amount,
        },
      ],
    }));
  };

  const handleRemoveAllocation = (billId: number) => {
    setFormData((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((a) => a.purchase_bill_id !== billId),
    }));
  };

  const handleAllocationAmountChange = (billId: number, val: string) => {
    setFormData((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a) =>
        a.purchase_bill_id === billId ? { ...a, allocated_amount: val } : a
      ),
    }));
  };

  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.supplier_id || !formData.account_id || !formData.amount) {
        setError("Supplier, financial account, and disbursement amount are required.");
        return;
      }

      const payload: any = {
        supplier: parseInt(formData.supplier_id, 10),
        financial_account: parseInt(formData.account_id, 10),
        amount: formData.amount,
        disbursement_date: formData.disbursement_date,
        payment_method: formData.payment_method,
        external_reference: formData.external_reference,
        notes: formData.notes,
      };

      if (formData.allocations.length > 0) {
        payload.allocations = formData.allocations.map((a) => ({
          purchase_bill: a.purchase_bill_id,
          allocated_amount: a.allocated_amount,
        }));
      }

      await adminApi.createSupplierDisbursement(payload);

      setSuccessMsg("Supplier disbursement drafted successfully.");
      setShowModal(false);
      setFormData({
        supplier_id: "",
        account_id: accounts.length > 0 ? String(accounts[0].id) : "",
        amount: "",
        disbursement_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        external_reference: "",
        notes: "",
        allocations: [],
      });
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create disbursement.");
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

      if (actionModal.type === "approve") {
        await adminApi.approveSupplierDisbursement(actionModal.disbursement.id);
        setSuccessMsg(`Disbursement ${actionModal.disbursement.disbursement_number} approved.`);
      } else if (actionModal.type === "complete") {
        await adminApi.completeSupplierDisbursement(actionModal.disbursement.id);
        setSuccessMsg(`Disbursement ${actionModal.disbursement.disbursement_number} completed and posted to ledger.`);
      } else if (actionModal.type === "reject") {
        if (!actionReason.trim()) {
          setError("Rejection reason is required.");
          return;
        }
        await adminApi.rejectSupplierDisbursement(actionModal.disbursement.id, actionReason);
        setSuccessMsg(`Disbursement ${actionModal.disbursement.disbursement_number} rejected.`);
      } else if (actionModal.type === "reverse") {
        if (!actionReason.trim()) {
          setError("Reversal reason is required.");
          return;
        }
        await adminApi.reverseSupplierDisbursement(actionModal.disbursement.id, actionReason);
        setSuccessMsg(`Disbursement ${actionModal.disbursement.disbursement_number} reversed with contra-entries.`);
      }

      setActionModal(null);
      setActionReason("");
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError(`Failed to ${actionModal.type} disbursement.`);
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredDisbursements = disbursements.filter((d) => {
    if (filterStatus && d.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = d.disbursement_number.toLowerCase().includes(q);
      const matchSupp = (d.supplier_name || "").toLowerCase().includes(q) || (d.supplier_code || "").toLowerCase().includes(q);
      const matchRef = (d.external_reference || "").toLowerCase().includes(q);
      if (!matchNum && !matchSupp && !matchRef) return false;
    }
    return true;
  });

  const getStatusBadge = (status: SupplierDisbursement["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="warning">Draft</Badge>;
      case "pending_approval":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "approved":
        return <Badge variant="primary">Approved</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="muted">Cancelled</Badge>;
      case "reversed":
        return <Badge variant="danger">Reversed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const totalDisbursedAmount = disbursements
    .filter((d) => d.status === "completed")
    .reduce((acc, d) => acc + parseFloat(d.amount || "0"), 0);

  const pendingApprovalCount = disbursements.filter(
    (d) => d.status === "pending_approval" || d.status === "draft"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Supplier Payments & Disbursements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execute payments to suppliers with maker-checker approvals and purchase bill clearing allocations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Initiate Disbursement
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
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Disbursements</p>
            <p className="text-xl font-bold text-foreground">{disbursements.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Settled Outflows</p>
            <p className="text-xl font-bold text-foreground">
              ৳{totalDisbursedAmount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Awaiting Review</p>
            <p className="text-xl font-bold text-foreground">{pendingApprovalCount}</p>
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
              placeholder="Search by disbursement #, supplier, ref..."
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
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed (Settled)</option>
              <option value="rejected">Rejected</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Disbursements Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Disbursement #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Source Account</th>
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
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading disbursements...
                  </td>
                </tr>
              ) : filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No supplier disbursements found.
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((d) => (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 text-center">
                        {d.allocations && d.allocations.length > 0 && (
                          <button
                            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground"
                          >
                            {expandedId === d.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {d.disbursement_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{d.supplier_name}</div>
                        <div className="text-xs text-muted-foreground">{d.supplier_code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{d.account_name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{d.account_code}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {d.disbursement_date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="capitalize text-foreground font-medium">
                          {d.payment_method.replace(/_/g, " ")}
                        </div>
                        {d.external_reference && (
                          <div className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                            Ref: {d.external_reference}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600">
                        -৳{parseFloat(d.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(d.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(d.status === "draft" || d.status === "pending_approval") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => setActionModal({ type: "approve", disbursement: d })}
                                title="Approve Disbursement (Maker-Checker)"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => setActionModal({ type: "reject", disbursement: d })}
                                title="Reject Disbursement"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {d.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                              onClick={() => setActionModal({ type: "complete", disbursement: d })}
                              title="Complete & Post Outflow"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          {d.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => setActionModal({ type: "reverse", disbursement: d })}
                              title="Reverse with Contra-Entry"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reverse
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === d.id && d.allocations && d.allocations.length > 0 && (
                      <tr className="bg-muted/10 border-b">
                        <td colSpan={9} className="py-3 px-8">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            Purchase Bill Allocations ({d.allocations.length})
                          </div>
                          <div className="bg-background rounded border p-3 divide-y">
                            {d.allocations.map((alloc) => (
                              <div
                                key={alloc.id}
                                className="py-2 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-medium text-foreground">
                                    Bill #{alloc.bill_number}
                                  </span>
                                  {alloc.supplier_invoice_ref && (
                                    <span className="text-muted-foreground ml-2">
                                      (Invoice Ref: {alloc.supplier_invoice_ref})
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono font-medium text-foreground">
                                  Allocated: ৳
                                  {parseFloat(alloc.allocated_amount).toLocaleString("en-BD", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Initiate Disbursement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Initiate Supplier Disbursement
            </h2>
            <form onSubmit={handleCreateDisbursement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.supplier_id}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Pay From Financial Account <span className="text-rose-500">*</span>
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
                    Total Amount (BDT) <span className="text-rose-500">*</span>
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
                    Disbursement Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.disbursement_date}
                    onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })}
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
                    <option value="bank_transfer">Bank Transfer / EFT / RTGS</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash Outflow</option>
                    <option value="bkash">bKash Merchant</option>
                    <option value="nagad">Nagad Merchant</option>
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
                    placeholder="Cheque # / TrxID / EFT Ref"
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Purchase Bill Allocations Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Optional Purchase Bill Allocations
                  </label>
                  {loadingBills && <span className="text-xs text-muted-foreground">Loading bills...</span>}
                </div>

                {formData.supplier_id && availableBills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Select posted bills to clear with this disbursement:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableBills
                        .filter((b) => !formData.allocations.some((a) => a.purchase_bill_id === b.id))
                        .map((b) => (
                          <Button
                            key={b.id}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAddBillAllocation(b)}
                          >
                            + Bill #{b.bill_number} (৳{parseFloat(b.total_amount).toLocaleString()})
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {formData.allocations.length > 0 && (
                  <div className="space-y-2 bg-muted/20 p-3 rounded-md border">
                    {formData.allocations.map((alloc) => (
                      <div
                        key={alloc.purchase_bill_id}
                        className="flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="font-medium text-foreground">
                          Bill #{alloc.bill_number} (Total: ৳{parseFloat(alloc.total).toLocaleString()})
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Allocate: ৳</span>
                          <input
                            type="number"
                            step="0.01"
                            value={alloc.allocated_amount}
                            onChange={(e) =>
                              handleAllocationAmountChange(alloc.purchase_bill_id, e.target.value)
                            }
                            className="w-28 px-2 py-1 border rounded text-right bg-background"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-rose-500"
                            onClick={() => handleRemoveAllocation(alloc.purchase_bill_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Disbursement purpose or internal notes..."
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
                      Initiating...
                    </>
                  ) : (
                    "Initiate Disbursement"
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
              {actionModal.type === "approve" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Approve Supplier Disbursement
                </>
              ) : actionModal.type === "complete" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Complete & Settle Disbursement
                </>
              ) : actionModal.type === "reject" ? (
                <>
                  <XCircle className="h-5 w-5 text-rose-600" />
                  Reject Supplier Disbursement
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Reverse Supplier Disbursement
                </>
              )}
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              {actionModal.type === "approve"
                ? `Maker-checker approval for disbursement ${actionModal.disbursement.disbursement_number} of ৳${parseFloat(actionModal.disbursement.amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })} to ${actionModal.disbursement.supplier_name}.`
                : actionModal.type === "complete"
                ? `Complete disbursement ${actionModal.disbursement.disbursement_number}. This will post an outflow transaction in ${actionModal.disbursement.account_name} and settle allocations against supplier bills.`
                : actionModal.type === "reject"
                ? `Reject disbursement ${actionModal.disbursement.disbursement_number}. The disbursement will be marked rejected.`
                : `Reversing disbursement ${actionModal.disbursement.disbursement_number} will create an offsetting inflow transaction in ${actionModal.disbursement.account_name} and reopen purchase bills.`}
            </p>

            {(actionModal.type === "reject" || actionModal.type === "reverse") && (
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
                  actionModal.type === "reject"
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
                ) : actionModal.type === "approve" ? (
                  "Confirm Approval"
                ) : actionModal.type === "complete" ? (
                  "Complete & Post Outflow"
                ) : actionModal.type === "reject" ? (
                  "Confirm Rejection"
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
