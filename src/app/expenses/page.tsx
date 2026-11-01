"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseDashboardMetrics, ExpenseCategoryBreakdownItem } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  CheckSquare,
  Clock,
  CreditCard,
  PlusCircle,
  RefreshCw,
  FolderTree,
  FileSpreadsheet,
  TrendingDown,
  PiggyBank,
  Coins,
  ArrowRight,
} from "lucide-react";

export default function ExpenseDashboardPage() {
  const [metrics, setMetrics] = useState<ExpenseDashboardMetrics | null>(null);
  const [categories, setCategories] = useState<ExpenseCategoryBreakdownItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, c] = await Promise.all([
        adminApi.getExpenseDashboard(),
        adminApi.getExpenseCategoryBreakdown(),
      ]);
      setMetrics(m);
      setCategories(c);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load expense dashboard data.");
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Management Cockpit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Operational expenditure tracking, approval queue, and Treasury-backed disbursement control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/expenses/vouchers/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Voucher
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenditures</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {metrics ? formatMoney(metrics.total_voucher_amount) : "—"}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Across {metrics?.total_vouchers_count ?? 0} active operating vouchers
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursed (Paid)</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {metrics ? formatMoney(metrics.total_paid_amount) : "—"}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Settled via Treasury accounts
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Approval</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {metrics ? formatMoney(metrics.pending_approval_amount) : "—"}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{metrics?.pending_approval_count ?? 0} vouchers awaiting sign-off</span>
            <Link href="/expenses/approvals" className="text-xs font-medium text-amber-600 hover:underline">
              Review Queue &rarr;
            </Link>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Unpaid</p>
              <h3 className="text-2xl font-bold text-purple-700 mt-1">
                {metrics ? formatMoney(metrics.approved_unpaid_amount) : "—"}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <CheckSquare className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {metrics?.approved_unpaid_count ?? 0} vouchers ready for payout
          </p>
        </Card>
      </div>

      {/* Quick Nav Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/expenses/vouchers" className="block">
          <Card className="p-4 hover:border-blue-500 transition-colors shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Vouchers Directory</h4>
                <p className="text-xs text-gray-500">View and manage all operating vouchers</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Card>
        </Link>

        <Link href="/expenses/categories" className="block">
          <Card className="p-4 hover:border-blue-500 transition-colors shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Expense Taxonomy</h4>
                <p className="text-xs text-gray-500">Configure hierarchical expense codes</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Card>
        </Link>

        <Link href="/expenses/reports" className="block">
          <Card className="p-4 hover:border-blue-500 transition-colors shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Expense Reports</h4>
                <p className="text-xs text-gray-500">Period analytics and category splits</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Card>
        </Link>
      </div>

      {/* Capital & Financing Quick Access */}
      <Card className="p-5 shadow-sm bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-indigo-600" />
              Capital, Financing & Equity Withdrawals
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Strictly segregated from operating expenses in accordance with standard accounting principles
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/finance/capital" className="p-3 bg-white border rounded-lg hover:border-indigo-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PiggyBank className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Capital Contributions</p>
                <p className="text-xs text-gray-500">Verified business equity inflows</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>

          <Link href="/finance/loans" className="p-3 bg-white border rounded-lg hover:border-indigo-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Business Loans</p>
                <p className="text-xs text-gray-500">Principal, schedules & repayments</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>

          <Link href="/finance/owner-drawings" className="p-3 bg-white border rounded-lg hover:border-indigo-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Owner Drawings</p>
                <p className="text-xs text-gray-500">Non-operating personal withdrawals</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </Card>

      {/* Categorical Breakdown */}
      <Card className="p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 text-base">Top Operating Categories</h3>
          <Link href="/expenses/categories" className="text-xs text-blue-600 hover:underline">
            Manage All Categories &rarr;
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No operating expenditures recorded yet. Create an expense voucher to populate category analytics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Vouchers</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Total Billed</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Disbursed</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((c) => (
                  <tr key={c.category_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{c.category_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.category_name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.voucher_count}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMoney(c.total_amount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(c.disbursed_amount)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{formatMoney(c.remaining_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

