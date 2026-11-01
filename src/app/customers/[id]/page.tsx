"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  CustomerProfile,
  CreditSummary,
  CustomerLedgerEntry,
  CustomerPaymentAllocation,
  CustomerType,
  CreditStatus,
} from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Users,
  Building2,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Edit,
  History,
  X,
  PlusCircle,
  Loader2,
  DollarSign,
  Scale,
} from "lucide-react";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const customerId = resolvedParams.id;

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [allocations, setAllocations] = useState<CustomerPaymentAllocation[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "business" | "credit" | "ledger" | "allocations" | "audit">("overview");

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Business Form State
  const [editBusinessName, setEditBusinessName] = useState<string>("");
  const [editContactPerson, setEditContactPerson] = useState<string>("");
  const [editTaxId, setEditTaxId] = useState<string>("");
  const [editType, setEditType] = useState<CustomerType>("wholesale");

  // Credit Application Modal
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applyLimit, setApplyLimit] = useState<string>("50000.00");
  const [applyTermsDays, setApplyTermsDays] = useState<number>(30);
  const [applyNotes, setApplyNotes] = useState<string>("");

  // Credit Approval Modal
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvedLimit, setApprovedLimit] = useState<string>("");
  const [approvedTermsDays, setApprovedTermsDays] = useState<number>(30);
  const [approveNotes, setApproveNotes] = useState<string>("");

  // Suspend Modal
  const [showSuspendModal, setShowSuspendModal] = useState<boolean>(false);
  const [suspendReason, setSuspendReason] = useState<string>("");

  // Update Limit Modal
  const [showUpdateLimitModal, setShowUpdateLimitModal] = useState<boolean>(false);
  const [newLimitVal, setNewLimitVal] = useState<string>("");
  const [updateLimitReason, setUpdateLimitReason] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, cs, allocs, ledg] = await Promise.all([
        adminApi.getCustomerProfile(customerId),
        adminApi.getCustomerCreditSummary(customerId),
        adminApi.getCustomerPaymentAllocations(customerId),
        adminApi.getCustomerLedger(customerId, { page_size: 50 }),
      ]);
      setProfile(p);
      setCreditSummary(cs);
      setAllocations(allocs);
      setLedgerEntries(ledg.results);

      setEditBusinessName(p.business_name);
      setEditContactPerson(p.business_contact_person);
      setEditTaxId(p.tax_identifier);
      setEditType(p.customer_type);
      setApprovedLimit(p.credit_limit);
      setApprovedTermsDays(p.payment_terms_days);
      setNewLimitVal(p.credit_limit);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load customer profile details.");
      }
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const updated = await adminApi.updateCustomerProfile(customerId, {
        business_name: editBusinessName,
        business_contact_person: editContactPerson,
        tax_identifier: editTaxId,
        customer_type: editType,
      });
      setProfile(updated);
      setSuccessMsg("Business profile updated successfully.");
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.applyCustomerCredit(customerId, {
        requested_limit: applyLimit,
        payment_terms_days: applyTermsDays,
        notes: applyNotes,
      });
      setShowApplyModal(false);
      setSuccessMsg("Credit facility application submitted for committee review.");
      loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit application.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.approveCustomerCredit(customerId, {
        approved_limit: approvedLimit,
        payment_terms_days: approvedTermsDays,
        notes: approveNotes,
      });
      setShowApproveModal(false);
      setSuccessMsg("Credit facility officially approved.");
      loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve credit facility.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.suspendCustomerCredit(customerId, suspendReason);
      setShowSuspendModal(false);
      setSuccessMsg("Credit facility suspended.");
      loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to suspend credit facility.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.updateCustomerCreditLimit(customerId, {
        new_limit: newLimitVal,
        reason: updateLimitReason,
      });
      setShowUpdateLimitModal(false);
      setSuccessMsg("Credit limit adjusted successfully.");
      loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to adjust limit.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-lumera-primary" />
        <span className="ml-2 text-lumera-text-muted">Loading customer cockpit...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="danger">
        Customer profile not found.
        <Link href="/customers" className="underline ml-2">Back to Directory</Link>
      </Alert>
    );
  }

  const limitNum = parseFloat(profile.credit_limit) || 0;
  const receivablesNum = parseFloat(profile.total_outstanding_receivables) || 0;
  const availableNum = parseFloat(profile.available_credit) || 0;
  const advancesNum = parseFloat(creditSummary?.total_unallocated_advances || "0") || 0;
  const overdueNum = parseFloat(creditSummary?.total_overdue_receivables || "0") || 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Directory
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-lumera-text-primary flex items-center gap-2">
              <Users className="h-6 w-6 text-lumera-primary" />
              {profile.display_name}
            </h1>
            <p className="text-xs text-lumera-text-muted">
              {profile.user?.email} • Customer Profile #{profile.id} • Registered {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href={`/customers/${profile.id}/statement`}>
            <Button variant="primary">
              <FileText className="h-4 w-4 mr-2" />
              Financial Statement
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Financial Health Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-l-4 border-l-lumera-primary">
          <p className="text-xs font-semibold text-lumera-text-muted uppercase">Approved Credit Ceiling</p>
          <p className="text-xl font-bold text-lumera-text-primary mt-1">৳{limitNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <span className="text-[11px] text-lumera-text-muted">
            Terms: {profile.payment_terms_days > 0 ? `Net ${profile.payment_terms_days} days` : "Immediate"}
          </span>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-danger">
          <p className="text-xs font-semibold text-lumera-text-muted uppercase">Outstanding Receivables</p>
          <p className={`text-xl font-bold mt-1 ${receivablesNum > 0 ? "text-lumera-danger" : "text-lumera-text-muted"}`}>
            ৳{receivablesNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-lumera-text-muted">Authoritative subledger balance</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-success">
          <p className="text-xs font-semibold text-lumera-text-muted uppercase">Available Credit</p>
          <p className={`text-xl font-bold mt-1 ${availableNum > 0 ? "text-lumera-success" : "text-lumera-text-muted"}`}>
            ৳{availableNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-lumera-text-muted">
            {profile.credit_enabled ? "Credit sales authorized" : "Credit facility inactive"}
          </span>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-warning">
          <p className="text-xs font-semibold text-lumera-text-muted uppercase">Overdue Receivables</p>
          <p className={`text-xl font-bold mt-1 ${overdueNum > 0 ? "text-lumera-warning" : "text-lumera-text-muted"}`}>
            ৳{overdueNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-lumera-text-muted">Invoices past payment terms</span>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-accent">
          <p className="text-xs font-semibold text-lumera-text-muted uppercase">Unallocated Advances</p>
          <p className="text-xl font-bold text-lumera-accent mt-1">
            ৳{advancesNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-lumera-text-muted">Available customer receipts</span>
        </Card>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-border flex gap-4 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "overview" ? "border-lumera-primary text-lumera-primary" : "border-transparent text-lumera-text-muted hover:text-lumera-text-primary"
          }`}
        >
          Overview & Identity
        </button>
        <button
          onClick={() => setActiveTab("business")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "business" ? "border-lumera-primary text-lumera-primary" : "border-transparent text-lumera-text-muted hover:text-lumera-text-primary"
          }`}
        >
          Business Information
        </button>
        <button
          onClick={() => setActiveTab("credit")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "credit" ? "border-lumera-primary text-lumera-primary" : "border-transparent text-lumera-text-muted hover:text-lumera-text-primary"
          }`}
        >
          Credit Governance
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "ledger" ? "border-lumera-primary text-lumera-primary" : "border-transparent text-lumera-text-muted hover:text-lumera-text-primary"
          }`}
        >
          Subledger Entries ({ledgerEntries.length})
        </button>
        <button
          onClick={() => setActiveTab("allocations")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "allocations" ? "border-lumera-primary text-lumera-primary" : "border-transparent text-lumera-text-muted hover:text-lumera-text-primary"
          }`}
        >
          Payment Allocations ({allocations.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "audit" ? "border-lumera-primary text-lumera-primary" : "border-transparent text-lumera-text-muted hover:text-lumera-text-primary"
          }`}
        >
          Credit Audit Log
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-lumera-text-primary flex items-center gap-2 border-b border-border pb-2">
              <Users className="h-5 w-5 text-lumera-primary" />
              Customer Master Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-lumera-text-muted">Account Type:</span>
              <span className="font-semibold capitalize">{profile.customer_type}</span>

              <span className="text-lumera-text-muted">Display Name:</span>
              <span className="font-semibold">{profile.display_name}</span>

              <span className="text-lumera-text-muted">Email Identity:</span>
              <span>{profile.user?.email}</span>

              <span className="text-lumera-text-muted">Phone Number:</span>
              <span>{profile.user?.phone || "—"}</span>

              <span className="text-lumera-text-muted">Account Status:</span>
              <span>
                <Badge variant={profile.user?.is_active ? "success" : "danger"}>
                  {profile.user?.is_active ? "Active Identity" : "Disabled"}
                </Badge>
              </span>

              <span className="text-lumera-text-muted">Credit Status:</span>
              <span>
                <Badge variant={profile.credit_status === "approved" ? "success" : profile.credit_status === "pending" ? "warning" : "muted"}>
                  {profile.credit_status}
                </Badge>
              </span>

              <span className="text-lumera-text-muted">Credit Eligibility:</span>
              <span>
                <Badge variant={profile.is_credit_eligible ? "success" : "danger"}>
                  {profile.is_credit_eligible ? "Eligible for Credit Sales" : "Ineligible / Blocked"}
                </Badge>
              </span>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-lumera-text-primary flex items-center gap-2 border-b border-border pb-2">
              <Building2 className="h-5 w-5 text-lumera-primary" />
              Corporate & Commercial Terms
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-lumera-text-muted">Business Name:</span>
              <span className="font-semibold">{profile.business_name || "—"}</span>

              <span className="text-lumera-text-muted">Contact Person:</span>
              <span>{profile.business_contact_person || "—"}</span>

              <span className="text-lumera-text-muted">Tax ID / TIN / BIN:</span>
              <span className="font-mono">{profile.tax_identifier || "—"}</span>

              <span className="text-lumera-text-muted">Approved Payment Terms:</span>
              <span className="font-semibold">
                {profile.payment_terms_days > 0 ? `Net ${profile.payment_terms_days} days` : "Immediate / Due on Receipt"}
              </span>

              <span className="text-lumera-text-muted">Approved By:</span>
              <span>{profile.approved_by_email || "System Auto"}</span>

              <span className="text-lumera-text-muted">Approved At:</span>
              <span>{profile.approved_at ? new Date(profile.approved_at).toLocaleString() : "—"}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Business Info */}
      {activeTab === "business" && (
        <Card className="p-6 max-w-2xl">
          <h3 className="text-base font-bold text-lumera-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Edit className="h-5 w-5 text-lumera-primary" />
            Edit Business Information
          </h3>
          <form onSubmit={handleUpdateBusiness} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                Customer Classification
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as CustomerType)}
                className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              >
                <option value="retail">Retail Customer</option>
                <option value="wholesale">Wholesale Buyer</option>
                <option value="corporate">Corporate / Institutional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                Registered Business Name
              </label>
              <input
                type="text"
                value={editBusinessName}
                onChange={(e) => setEditBusinessName(e.target.value)}
                className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={editContactPerson}
                onChange={(e) => setEditContactPerson(e.target.value)}
                className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                Tax ID / TIN / BIN
              </label>
              <input
                type="text"
                value={editTaxId}
                onChange={(e) => setEditTaxId(e.target.value)}
                className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="primary" type="submit" disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab: Credit Governance */}
      {activeTab === "credit" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-lumera-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
              <CreditCard className="h-5 w-5 text-lumera-primary" />
              Wholesale Credit Facility Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-surface-muted rounded-md">
                <span className="text-xs text-lumera-text-muted uppercase font-semibold">Current Facility Status</span>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={profile.credit_status === "approved" ? "success" : profile.credit_status === "pending" ? "warning" : "danger"}>
                    {profile.credit_status}
                  </Badge>
                  <span className="text-xs text-lumera-text-muted">
                    {profile.credit_enabled ? "(Credit Active)" : "(Credit Inactive)"}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-surface-muted rounded-md">
                <span className="text-xs text-lumera-text-muted uppercase font-semibold">Approved Exposure Limit</span>
                <p className="text-2xl font-bold text-lumera-text-primary mt-1">৳{limitNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-surface-muted rounded-md">
                <span className="text-xs text-lumera-text-muted uppercase font-semibold">Approved Payment Terms</span>
                <p className="text-xl font-bold text-lumera-text-primary mt-1">
                  {profile.payment_terms_days > 0 ? `Net ${profile.payment_terms_days} days` : "Immediate Payment"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {profile.customer_type !== "retail" && profile.credit_status !== "approved" && (
                <Button variant="primary" onClick={() => setShowApplyModal(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Submit Credit Application
                </Button>
              )}
              {profile.credit_status === "pending" && (
                <Button variant="primary" onClick={() => setShowApproveModal(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Facility (Maker-Checker)
                </Button>
              )}
              {profile.credit_status === "approved" && (
                <>
                  <Button variant="secondary" onClick={() => setShowUpdateLimitModal(true)}>
                    <Scale className="h-4 w-4 mr-2" />
                    Adjust Credit Ceiling
                  </Button>
                  <Button variant="danger" onClick={() => setShowSuspendModal(true)}>
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Suspend Credit Facility
                  </Button>
                </>
              )}
              {profile.credit_status === "suspended" && (
                <Button variant="primary" onClick={() => setShowApproveModal(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Re-instate Facility
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Subledger */}
      {activeTab === "ledger" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-surface-muted/30">
            <div>
              <h3 className="font-bold text-lumera-text-primary flex items-center gap-2">
                <Receipt className="h-4 w-4 text-lumera-primary" />
                Append-Only Customer Receivables Subledger
              </h3>
              <p className="text-xs text-lumera-text-muted">
                Authoritative record of commercial invoice debits, payment credits, and adjustments.
              </p>
            </div>
            <Link href={`/customers/${profile.id}/statement`}>
              <Button variant="secondary" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Open Full Statement View
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs font-semibold uppercase text-lumera-text-muted border-b">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Entry Number</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Document Ref</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Debit (BDT)</th>
                  <th className="py-2.5 px-4 text-right">Credit (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-lumera-text-muted">
                      No posted subledger entries recorded for this customer account.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-muted/40">
                      <td className="py-2.5 px-4 whitespace-nowrap text-xs">{e.effective_date}</td>
                      <td className="py-2.5 px-4 font-mono text-xs">{e.entry_number}</td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            e.entry_type === "invoice"
                              ? "danger"
                              : e.entry_type === "payment"
                              ? "success"
                              : e.entry_type === "credit_note"
                              ? "accent"
                              : "muted"
                          }
                        >
                          {e.entry_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-xs font-medium">{e.source_id}</td>
                      <td className="py-2.5 px-4 text-xs text-lumera-text-muted max-w-xs truncate">{e.description}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-xs">
                        {parseFloat(e.debit_amount) > 0 ? `৳${parseFloat(e.debit_amount).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-xs text-lumera-success">
                        {parseFloat(e.credit_amount) > 0 ? `৳${parseFloat(e.credit_amount).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Allocations */}
      {activeTab === "allocations" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-muted/30">
            <h3 className="font-bold text-lumera-text-primary flex items-center gap-2">
              <Scale className="h-4 w-4 text-lumera-primary" />
              Verified Payment Allocations
            </h3>
            <p className="text-xs text-lumera-text-muted">
              Connects verified payment ledger receipts to outstanding sales invoices.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs font-semibold uppercase text-lumera-text-muted border-b">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Allocation Ref</th>
                  <th className="py-2.5 px-4">Receipt Entry</th>
                  <th className="py-2.5 px-4">Target Invoice</th>
                  <th className="py-2.5 px-4 text-right">Allocated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-lumera-text-muted">
                      No payment allocations recorded yet.
                    </td>
                  </tr>
                ) : (
                  allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-muted/40">
                      <td className="py-2.5 px-4 text-xs">{a.allocation_date}</td>
                      <td className="py-2.5 px-4 font-mono text-xs">{a.allocation_reference}</td>
                      <td className="py-2.5 px-4 text-xs">{a.receipt_entry_number}</td>
                      <td className="py-2.5 px-4 text-xs font-medium text-lumera-primary">
                        Invoice #{a.invoice_number}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-xs text-lumera-success">
                        ৳{parseFloat(a.allocated_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Audit Log */}
      {activeTab === "audit" && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-lumera-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
            <History className="h-5 w-5 text-lumera-primary" />
            Credit Committee Audit Trail & Notes
          </h3>
          <div className="bg-surface-muted p-4 rounded-md font-mono text-xs text-lumera-text-primary whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {profile.credit_notes || "No administrative credit audit records logged."}
          </div>
        </Card>
      )}

      {/* Modal: Apply Credit */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-surface shadow-xl">
            <h3 className="text-lg font-bold text-lumera-text-primary mb-4">Submit Credit Application</h3>
            <form onSubmit={handleApplyCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Requested Credit Limit (BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={applyLimit}
                  onChange={(e) => setApplyLimit(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Requested Payment Terms (Days) *
                </label>
                <select
                  value={applyTermsDays}
                  onChange={(e) => setApplyTermsDays(Number(e.target.value))}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                >
                  <option value={15}>Net 15 days</option>
                  <option value={30}>Net 30 days</option>
                  <option value={60}>Net 60 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Application Justification / Remarks
                </label>
                <textarea
                  rows={3}
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={actionLoading}>Submit Application</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Approve Credit */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-surface shadow-xl">
            <h3 className="text-lg font-bold text-lumera-text-primary mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-lumera-success" />
              Approve Credit Facility
            </h3>
            <p className="text-xs text-lumera-text-muted mb-4">
              Enforces Maker-Checker governance. Authorizes positive credit exposure for B2B wholesale orders.
            </p>
            <form onSubmit={handleApproveCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Approved Credit Limit (BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={approvedLimit}
                  onChange={(e) => setApprovedLimit(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Approved Terms (Days) *
                </label>
                <select
                  value={approvedTermsDays}
                  onChange={(e) => setApprovedTermsDays(Number(e.target.value))}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                >
                  <option value={15}>Net 15 days</option>
                  <option value={30}>Net 30 days</option>
                  <option value={60}>Net 60 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Approval Notes / Committee Remarks
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={actionLoading}>Authorize Credit Facility</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Suspend Credit */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-surface shadow-xl">
            <h3 className="text-lg font-bold text-lumera-danger mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-lumera-danger" />
              Suspend Credit Facility
            </h3>
            <p className="text-xs text-lumera-text-muted mb-4">
              Freezes new credit sales for this account. Existing receivables remain preserved on subledger.
            </p>
            <form onSubmit={handleSuspendCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Reason for Suspension *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Overdue balance past 60 days without payment response..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setShowSuspendModal(false)}>Cancel</Button>
                <Button variant="danger" type="submit" disabled={actionLoading}>Confirm Suspension</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Update Limit */}
      {showUpdateLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-surface shadow-xl">
            <h3 className="text-lg font-bold text-lumera-text-primary mb-4">Adjust Credit Limit</h3>
            <form onSubmit={handleUpdateLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  New Credit Limit (BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newLimitVal}
                  onChange={(e) => setNewLimitVal(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Justification / Audit Note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Annual contract renewal with higher credit guarantee..."
                  value={updateLimitReason}
                  onChange={(e) => setUpdateLimitReason(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setShowUpdateLimitModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={actionLoading}>Save New Ceiling</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

