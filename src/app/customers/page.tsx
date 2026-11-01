"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CustomerProfile, CustomerType, CreditStatus } from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Users,
  Search,
  RefreshCw,
  PlusCircle,
  Eye,
  FileText,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Loader2,
} from "lucide-react";

export default function CustomersDirectoryPage() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [creditStatusFilter, setCreditStatusFilter] = useState<string>("");
  const [creditEnabledFilter, setCreditEnabledFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createUserId, setCreateUserId] = useState<string>("");
  const [createType, setCreateType] = useState<CustomerType>("wholesale");
  const [createBusinessName, setCreateBusinessName] = useState<string>("");
  const [createContactPerson, setCreateContactPerson] = useState<string>("");
  const [createTaxId, setCreateTaxId] = useState<string>("");
  const [createNotes, setCreateNotes] = useState<string>("");
  const [createSaving, setCreateSaving] = useState<boolean>(false);

  // Users lookup for create modal
  const [usersList, setUsersList] = useState<{ id: number; email: string; full_name: string }[]>([]);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getCustomerProfiles({
        q: search || undefined,
        customer_type: typeFilter || undefined,
        credit_status: creditStatusFilter || undefined,
        credit_enabled: creditEnabledFilter || undefined,
        page,
        page_size: pageSize,
      });
      setProfiles(data.results);
      setTotalCount(data.count);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load customer profiles.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, creditStatusFilter, creditEnabledFilter, page, pageSize]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers({ page: 1 });
      setUsersList(
        (data.results || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          full_name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
        }))
      );
    } catch {
      // Fallback
    }
  };

  const handleOpenCreateModal = () => {
    loadUsers();
    setShowCreateModal(true);
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserId) {
      setError("Please select a user account to extend.");
      return;
    }
    try {
      setCreateSaving(true);
      setError(null);
      await adminApi.createCustomerProfile({
        user_id: Number(createUserId),
        customer_type: createType,
        business_name: createBusinessName,
        business_contact_person: createContactPerson,
        tax_identifier: createTaxId,
        credit_notes: createNotes,
      });
      setShowCreateModal(false);
      setSuccessMsg("Customer profile created successfully.");
      setCreateUserId("");
      setCreateBusinessName("");
      setCreateContactPerson("");
      setCreateTaxId("");
      setCreateNotes("");
      loadProfiles();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create customer profile.");
      }
    } finally {
      setCreateSaving(false);
    }
  };

  // KPI Calculations
  const wholesaleCount = profiles.filter((p) => p.customer_type === "wholesale" || p.customer_type === "corporate").length;
  const activeCreditCount = profiles.filter((p) => p.credit_enabled && p.credit_status === "approved").length;
  const totalReceivables = profiles.reduce(
    (acc, p) => acc + (parseFloat(p.total_outstanding_receivables) || 0),
    0
  );

  const getCreditBadge = (statusVal: CreditStatus, enabled: boolean) => {
    if (enabled && statusVal === "approved") {
      return <Badge variant="success">Approved</Badge>;
    }
    switch (statusVal) {
      case "pending":
        return <Badge variant="warning">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "suspended":
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="muted">No Facility</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lumera-text-primary flex items-center gap-2">
            <Users className="h-6 w-6 text-lumera-primary" />
            Customer Directory & Receivables
          </h1>
          <p className="text-sm text-lumera-text-muted">
            Manage retail, wholesale, and corporate customer profiles, credit terms, and subledgers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => loadProfiles()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleOpenCreateModal}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Customer Profile
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-lumera-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-lumera-text-muted uppercase">Total Directory Profiles</p>
              <p className="text-2xl font-bold text-lumera-text-primary mt-1">{totalCount}</p>
            </div>
            <Users className="h-8 w-8 text-lumera-primary/40" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-lumera-text-muted uppercase">B2B Wholesale / Corporate</p>
              <p className="text-2xl font-bold text-lumera-accent mt-1">{wholesaleCount}</p>
            </div>
            <Building2 className="h-8 w-8 text-lumera-accent/40" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-lumera-text-muted uppercase">Active Credit Accounts</p>
              <p className="text-2xl font-bold text-lumera-success mt-1">{activeCreditCount}</p>
            </div>
            <CreditCard className="h-8 w-8 text-lumera-success/40" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-lumera-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-lumera-text-muted uppercase">Total Outstanding Receivables</p>
              <p className="text-2xl font-bold text-lumera-warning mt-1">৳{totalReceivables.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <Clock className="h-8 w-8 text-lumera-warning/40" />
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-lumera-text-muted" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, business, or TIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            >
              <option value="">All Customer Types</option>
              <option value="retail">Retail Customer</option>
              <option value="wholesale">Wholesale Buyer</option>
              <option value="corporate">Corporate Account</option>
            </select>
          </div>
          <div>
            <select
              value={creditStatusFilter}
              onChange={(e) => setCreditStatusFilter(e.target.value)}
              className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            >
              <option value="">All Credit Statuses</option>
              <option value="none">No Facility</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Credit Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <select
              value={creditEnabledFilter}
              onChange={(e) => setCreditEnabledFilter(e.target.value)}
              className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            >
              <option value="">Credit Sales (Any)</option>
              <option value="true">Credit Sales Active</option>
              <option value="false">Credit Sales Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b text-xs font-semibold uppercase text-lumera-text-muted">
              <tr>
                <th className="py-3 px-4">Customer Identity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Credit Status</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Receivables Owed</th>
                <th className="py-3 px-4 text-right">Available Credit</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-lumera-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-lumera-primary" />
                    Loading customer directory...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-lumera-text-muted">
                    No customer profiles match the current filter criteria.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => {
                  const receivablesNum = parseFloat(p.total_outstanding_receivables) || 0;
                  const availableNum = parseFloat(p.available_credit) || 0;
                  const limitNum = parseFloat(p.credit_limit) || 0;

                  return (
                    <tr key={p.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/customers/${p.id}`} className="font-semibold text-lumera-primary hover:underline block">
                          {p.display_name}
                        </Link>
                        <div className="text-xs text-lumera-text-muted">
                          {p.user?.email} {p.user?.phone ? `• ${p.user.phone}` : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            p.customer_type === "corporate"
                              ? "accent"
                              : p.customer_type === "wholesale"
                              ? "primary"
                              : "muted"
                          }
                        >
                          {p.customer_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getCreditBadge(p.credit_status, p.credit_enabled)}
                        {p.payment_terms_days > 0 && (
                          <span className="block text-[11px] text-lumera-text-muted mt-0.5">
                            Net {p.payment_terms_days} days
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {limitNum > 0 ? `৳${limitNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span className={receivablesNum > 0 ? "text-lumera-danger" : "text-lumera-text-muted"}>
                          ৳{receivablesNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {p.credit_enabled ? (
                          <span className={availableNum > 0 ? "text-lumera-success" : "text-lumera-text-muted"}>
                            ৳{availableNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/customers/${p.id}`}>
                            <Button variant="ghost" size="sm" title="View Profile Cockpit">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/customers/${p.id}/statement`}>
                            <Button variant="ghost" size="sm" title="Account Statement">
                              <FileText className="h-4 w-4 text-lumera-primary" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-lumera-text-muted">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} profiles
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= totalCount}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Customer Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 bg-surface shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h2 className="text-lg font-bold text-lumera-text-primary flex items-center gap-2">
                <Users className="h-5 w-5 text-lumera-primary" />
                Initialize Customer Profile
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-lumera-text-muted hover:text-lumera-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Select Registered User Account *
                </label>
                <select
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  required
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                >
                  <option value="">-- Choose User --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Customer Classification *
                </label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value as CustomerType)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                >
                  <option value="retail">Retail Customer (Standard)</option>
                  <option value="wholesale">Wholesale Buyer (B2B)</option>
                  <option value="corporate">Corporate / Institutional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Registered Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Trading Bangladesh Ltd"
                  value={createBusinessName}
                  onChange={(e) => setCreateBusinessName(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahim Chowdhury"
                    value={createContactPerson}
                    onChange={(e) => setCreateContactPerson(e.target.value)}
                    className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                    Tax ID / TIN / BIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012"
                    value={createTaxId}
                    onChange={(e) => setCreateTaxId(e.target.value)}
                    className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-lumera-text-muted uppercase mb-1">
                  Internal Administrative Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Onboarding background or commercial relationship notes..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className="w-full py-2 px-3 border rounded-md text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={createSaving}>
                  {createSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Save Customer Profile
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

