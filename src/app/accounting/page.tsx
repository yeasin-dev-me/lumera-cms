"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingDashboardMetrics } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FolderTree,
  Receipt,
  CheckSquare,
  Scale,
  CalendarClock,
  PlusCircle,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export default function AccountingDashboardPage() {
  const [metrics, setMetrics] = useState<AccountingDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getAccountingDashboard();
      setMetrics(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load accounting dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "posted":
        return "success";
      case "approved":
        return "accent";
      case "pending_approval":
        return "warning";
      case "draft":
        return "muted";
      case "rejected":
      case "cancelled":
        return "danger";
      default:
        return "muted";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Double-Entry Accounting & General Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative Chart of Accounts, immutable journal posting, and financial trial balance verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/accounting/journals/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Journal Entry
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Trial Balance Health Banner */}
      {metrics && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between ${
            metrics.trial_balance.is_balanced
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
              : "bg-red-50/50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            {metrics.trial_balance.is_balanced ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                General Ledger Equilibrium:{" "}
                {metrics.trial_balance.is_balanced
                  ? "Double-Entry Equations in Strict Balance (Σ Debits = Σ Credits)"
                  : `Discrepancy Detected! Difference: ${formatMoney(metrics.trial_balance.difference)}`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Total Posted Debits: {formatMoney(metrics.trial_balance.total_debit)} | Total Posted Credits:{" "}
                {formatMoney(metrics.trial_balance.total_credit)}
              </p>
            </div>
          </div>
          <Link href="/accounting/trial-balance">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs bg-white">
              <Scale className="h-3.5 w-3.5" />
              View Trial Balance
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Accounts */}
        <Card className="p-5 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Chart of Accounts</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {metrics ? metrics.accounts.total_active : "—"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {metrics ? `${metrics.accounts.posting_accounts} posting / ${metrics.accounts.group_accounts} group` : ""}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FolderTree className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Awaiting Approval</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {metrics ? metrics.journals.pending_approval_count : "—"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Maker-checker approval queue</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <CheckSquare className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Posted Journals */}
        <Card className="p-5 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Posted Journals</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {metrics ? metrics.journals.posted_count : "—"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {metrics ? `${metrics.journals.reversed_count} reversed entries` : ""}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Receipt className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Active Period */}
        <Card className="p-5 border-l-4 border-l-indigo-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Period</p>
              <h3 className="text-base font-bold text-gray-900 mt-1 truncate max-w-[150px]">
                {metrics?.current_open_period ? metrics.current_open_period.name : "None Open"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {metrics?.current_open_period
                  ? `${metrics.current_open_period.start_date} to ${metrics.current_open_period.end_date}`
                  : "All periods locked"}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarClock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/accounting/chart-of-accounts" className="group">
          <Card className="p-4 hover:shadow-md transition-shadow border group-hover:border-blue-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Chart of Accounts</h4>
                <p className="text-xs text-gray-500">Hierarchical taxonomy & codes</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/accounting/journals" className="group">
          <Card className="p-4 hover:shadow-md transition-shadow border group-hover:border-purple-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Journal Entries</h4>
                <p className="text-xs text-gray-500">Manual drafts & posted vouchers</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/accounting/journals/approvals" className="group">
          <Card className="p-4 hover:shadow-md transition-shadow border group-hover:border-amber-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Approval Queue</h4>
                <p className="text-xs text-gray-500">Maker-checker authorizations</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/accounting/general-ledger" className="group">
          <Card className="p-4 hover:shadow-md transition-shadow border group-hover:border-emerald-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">General Ledger</h4>
                <p className="text-xs text-gray-500">Chronological running balances</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Journal Entries Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Journal Vouchers</h3>
            <p className="text-xs text-gray-500 mt-0.5">Most recent journal records across all workflow states</p>
          </div>
          <Link href="/accounting/journals" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Journals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Journal #</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {metrics && metrics.recent_journals.length > 0 ? (
                metrics.recent_journals.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-900">
                      <Link href={`/accounting/journals/${j.id}`} className="hover:underline text-blue-600">
                        {j.journal_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{j.journal_date}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-700">{j.journal_type.replace("_", " ")}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">{j.description}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatMoney(j.total_debit)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={getStatusBadgeVariant(j.status)}>
                        {j.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link href={`/accounting/journals/${j.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    {loading ? "Loading journal vouchers..." : "No journal entries found in system."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

