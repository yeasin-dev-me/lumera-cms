"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { FinancialAccount, FinancialAccountType } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Landmark,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  X,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

export default function FinancialAccountsPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Create Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    account_type: "bank" as FinancialAccountType,
    currency: "BDT",
    provider: "",
    bank_name: "",
    account_number: "",
    branch_name: "",
    account_holder_name: "",
    routing_number: "",
    opening_balance: "0.00",
    notes: "",
  });

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (typeFilter) params.account_type = typeFilter;
      if (search) params.search = search;
      const data = await adminApi.getFinancialAccounts(params);
      setAccounts(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load financial accounts.");
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await adminApi.createFinancialAccount(formData);
      setSuccessMsg(`Account '${formData.code}' created successfully.`);
      setShowModal(false);
      setFormData({
        code: "",
        name: "",
        account_type: "bank",
        currency: "BDT",
        provider: "",
        bank_name: "",
        account_number: "",
        branch_name: "",
        account_holder_name: "",
        routing_number: "",
        opening_balance: "0.00",
        notes: "",
      });
      loadAccounts();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create financial account.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Financial Repositories
          </h1>
          <p className="text-sm text-neutral-500">
            Manage cash tills, commercial bank accounts, merchant MFS wallets, and clearing accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadAccounts}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {/* Filter bar */}
      <Card className="p-4 bg-white border border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search code or account name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
            >
              <option value="">All Account Types</option>
              <option value="bank">Bank Accounts</option>
              <option value="cash">Cash Tills / Safe</option>
              <option value="mfs">MFS Merchant Wallets</option>
              <option value="clearing">Clearing Accounts</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Accounts List Table */}
      <Card className="bg-white border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Account Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Institution / Masked No</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Cashbook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length > 0 ? (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {acc.code}
                    </td>
                    <td className="px-4 py-3 text-neutral-800">
                      {acc.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          acc.account_type === "bank"
                            ? "primary"
                            : acc.account_type === "cash"
                            ? "success"
                            : acc.account_type === "mfs"
                            ? "warning"
                            : "muted"
                        }
                      >
                        {acc.account_type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 font-mono">
                      {acc.bank_name ? `${acc.bank_name} ` : ""}
                      {acc.masked_account_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">
                      {formatMoney(acc.current_balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {acc.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/treasury/accounts/${acc.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" /> Ledger
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    No financial accounts match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Create Financial Account</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Account Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BANK-CITY-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Account Type *</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) =>
                      setFormData({ ...formData, account_type: e.target.value as FinancialAccountType })
                    }
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash Drawer / Safe</option>
                    <option value="mfs">Mobile Financial Services (MFS)</option>
                    <option value="clearing">Clearing Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Account Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Bank Operating Account"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {formData.account_type === "bank" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. The City Bank Ltd"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulshan Branch"
                      value={formData.branch_name}
                      onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              )}

              {(formData.account_type === "bank" || formData.account_type === "mfs") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">
                      {formData.account_type === "mfs" ? "Merchant Wallet Number" : "Account Number"}
                    </label>
                    <input
                      type="text"
                      placeholder={formData.account_type === "mfs" ? "017XXXXXXXX" : "1102938475001"}
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">
                      {formData.account_type === "mfs" ? "MFS Provider" : "Routing Number"}
                    </label>
                    <input
                      type="text"
                      placeholder={formData.account_type === "mfs" ? "bkash / nagad" : "225272635"}
                      value={formData.account_type === "mfs" ? formData.provider : formData.routing_number}
                      onChange={(e) =>
                        formData.account_type === "mfs"
                          ? setFormData({ ...formData, provider: e.target.value })
                          : setFormData({ ...formData, routing_number: e.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Currency</label>
                  <input
                    type="text"
                    disabled
                    value={formData.currency}
                    className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-100 p-2 text-sm text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder="Optional internal remarks..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
