"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseCategoryBreakdownItem, ExpenseDashboardMetrics } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileSpreadsheet,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Printer,
  Receipt,
  CreditCard,
  Clock,
} from "lucide-react";

export default function ExpenseReportsPage() {
  const [categories, setCategories] = useState<ExpenseCategoryBreakdownItem[]>([]);
  const [metrics, setMetrics] = useState<ExpenseDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [c, m] = await Promise.all([
        adminApi.getExpenseCategoryBreakdown(params),
        adminApi.getExpenseDashboard(params),
      ]);
      setCategories(c);
      setMetrics(m);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load expense report analytics.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/expenses" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Expenses
            </Link>
            <span>/</span>
            <span>Reports</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Operating Expense Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Categorized operating cost analytics and Treasury disbursement reconciliation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
          <Button variant="primary" onClick={loadReport} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Date Filter Bar */}
      <Card className="p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-gray-700 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gray-500" />
            Reporting Period:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-lg px-2.5 py-1.5 text-xs border-gray-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-lg px-2.5 py-1.5 text-xs border-gray-300"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-blue-600"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">Penguin Mart — Operating Expense Report</h2>
        <p className="text-xs text-gray-600">
          Generated: {new Date().toLocaleDateString()} &bull; Period: {startDate || "All Time"} to {endDate || "Present"}
        </p>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 shadow-sm bg-blue-50/50 border-blue-200">
            <p className="text-xs font-semibold text-blue-800 uppercase">Total Billed Expenses</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{formatMoney(metrics.total_voucher_amount)}</p>
            <p className="text-xs text-blue-700 mt-1">{metrics.total_vouchers_count} vouchers recorded</p>
          </Card>

          <Card className="p-4 shadow-sm bg-emerald-50/50 border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800 uppercase">Total Disbursed (Paid)</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{formatMoney(metrics.total_paid_amount)}</p>
            <p className="text-xs text-emerald-700 mt-1">Settled via Treasury</p>
          </Card>

          <Card className="p-4 shadow-sm bg-amber-50/50 border-amber-200">
            <p className="text-xs font-semibold text-amber-800 uppercase">Outstanding Payable</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{formatMoney(metrics.total_outstanding_payable)}</p>
            <p className="text-xs text-amber-700 mt-1">Pending payout</p>
          </Card>
        </div>
      )}

      {/* Category Breakdown Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-900 text-sm">Categorical Expenditure Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category Name</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Vouchers</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Billed Total</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Disbursed (Paid)</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No expenditures found for the selected period.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.category_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{c.category_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.category_name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.voucher_count}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(c.total_amount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{formatMoney(c.disbursed_amount)}</td>
                    <td className="px-4 py-3 text-right text-amber-700 font-medium">{formatMoney(c.remaining_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

