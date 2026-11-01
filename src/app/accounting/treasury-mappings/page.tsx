"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { TreasuryAccountMapping, ExpenseCategoryAccountMapping } from "@/types/events";
import { FinancialAccount } from "@/types/treasury";
import { Account } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Building2,
  RefreshCw,
  PlusCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
} from "lucide-react";

export default function TreasuryMappingsPage() {
  const [tab, setTab] = useState<"treasury" | "expenses">("treasury");

  const [treasuryMappings, setTreasuryMappings] = useState<TreasuryAccountMapping[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [expenseMappings, setExpenseMappings] = useState<ExpenseCategoryAccountMapping[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal / Form state for Treasury mapping
  const [selectedFaId, setSelectedFaId] = useState<string>("");
  const [selectedAccId, setSelectedAccId] = useState<string>("");
  const [mappingNotes, setMappingNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tRes, faRes, expRes, accsRes] = await Promise.all([
        adminApi.getTreasuryMappings(),
        adminApi.getFinancialAccounts(),
        adminApi.getExpenseCategoryMappings(),
        adminApi.getAccounts({ is_group: false }),
      ]);

      setTreasuryMappings(Array.isArray(tRes) ? tRes : (tRes as any)?.results || []);
      setFinancialAccounts(Array.isArray(faRes) ? faRes : (faRes as any)?.results || []);
      setExpenseMappings(Array.isArray(expRes) ? expRes : (expRes as any)?.results || []);
      setAccounts(Array.isArray(accsRes) ? accsRes : (accsRes as any)?.results || []);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load treasury and expense mapping configurations.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveTreasuryMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaId || !selectedAccId) {
      setError("Please select both a Treasury Financial Account and an Accounting Account.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setActionSuccess(null);
      await adminApi.setTreasuryMapping({
        financial_account_id: Number(selectedFaId),
        accounting_account_id: Number(selectedAccId),
        notes: mappingNotes.trim(),
      });
      setActionSuccess("Successfully updated Treasury account mapping.");
      setSelectedFaId("");
      setSelectedAccId("");
      setMappingNotes("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save Treasury mapping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Link href="/accounting" className="hover:text-neutral-900 transition-colors">
              Accounting
            </Link>
            <span>/</span>
            <Link href="/accounting/events" className="hover:text-neutral-900 transition-colors">
              Events
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Subledger Mappings</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Treasury & Expense Account Mappings</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Connect operational financial accounts (Bank, Cash, MFS) and expense categories to authoritative Chart of Accounts ledger nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 gap-4">
        <button
          onClick={() => setTab("treasury")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            tab === "treasury"
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Treasury Financial Accounts ({financialAccounts.length})
        </button>
        <button
          onClick={() => setTab("expenses")}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            tab === "expenses"
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Expense Category Mappings ({expenseMappings.length})
        </button>
      </div>

      {tab === "treasury" ? (
        <div className="space-y-6">
          {/* Quick Mapping Form */}
          <Card className="p-5 border border-neutral-200 bg-white">
            <h2 className="text-base font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
              Configure Treasury Financial Account Mapping
            </h2>
            <form onSubmit={handleSaveTreasuryMapping} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Treasury Account *</label>
                <select
                  value={selectedFaId}
                  onChange={(e) => setSelectedFaId(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="">-- Select Treasury Account --</option>
                  {financialAccounts.map((fa) => (
                    <option key={fa.id} value={fa.id}>
                      [{fa.code}] {fa.name} ({fa.account_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Target GL Account *</label>
                <select
                  value={selectedAccId}
                  onChange={(e) => setSelectedAccId(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="">-- Select Accounting Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name} ({acc.account_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Mapping notes..."
                  value={mappingNotes}
                  onChange={(e) => setMappingNotes(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <Button type="submit" variant="primary" disabled={saving} className="w-full flex items-center justify-center gap-1.5">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Mapping"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Treasury Mappings Table */}
          <Card className="overflow-hidden border border-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-medium">
                  <tr>
                    <th className="py-3 px-4">Treasury Account</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Mapped GL Account</th>
                    <th className="py-3 px-4">Account Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {financialAccounts.map((fa) => {
                    const mapping = treasuryMappings.find((m) => m.financial_account_id === fa.id);
                    return (
                      <tr key={fa.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{fa.name}</div>
                          <div className="text-xs font-mono text-neutral-400">[{fa.code}]</div>
                        </td>
                        <td className="py-3 px-4 uppercase text-xs font-medium text-neutral-600">
                          {fa.account_type}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {mapping ? (
                            <span className="font-semibold text-neutral-900">
                              [{mapping.accounting_account_code}] {mapping.accounting_account_name}
                            </span>
                          ) : (
                            <Badge variant="danger">Unmapped (Action Required)</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-600">
                          {mapping?.financial_account_type || "Asset"}
                        </td>
                        <td className="py-3 px-4">
                          {mapping?.is_active ? (
                            <Badge variant="success">Active</Badge>
                          ) : mapping ? (
                            <Badge variant="muted">Inactive</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-500">
                          {mapping?.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="overflow-hidden border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Expense Category</th>
                  <th className="py-3 px-4">Category Code</th>
                  <th className="py-3 px-4">Mapped GL Expense Account</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {expenseMappings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-neutral-500">
                      No category mappings configured.
                    </td>
                  </tr>
                ) : (
                  expenseMappings.map((em) => (
                    <tr key={em.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-neutral-900">{em.expense_category_name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-neutral-500">[{em.expense_category_code}]</td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-neutral-900">
                        [{em.accounting_account_code}] {em.accounting_account_name}
                      </td>
                      <td className="py-3 px-4">
                        {em.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

