"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  TrendingDown,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Scale,
  DollarSign,
  Layers,
} from "lucide-react";

export default function ExpenseAnalyticsPage() {
  const [data, setData] = useState<ExpenseAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getExpenseAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load expense analytics data.");
      }
    } finally {
      setLoading(false);
    }
  }, [preset, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val?: string | number) => {
    if (val === undefined || val === null) return "0.00";
    const num = Number(val);
    return isNaN(num)
      ? "0.00"
      : num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/analytics"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Executive Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-indigo-600" />
            Expense Intelligence & Profitability Cockpit
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative operating expense surveillance, category spend, financing isolation, and General Ledger P&L margins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.profitability.currency_warning && (
            <Badge variant="warning" className="flex items-center gap-1 font-mono text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              PROVISIONAL ({data.profitability.currency_warning})
            </Badge>
          )}
          <Badge variant="muted" className="font-mono text-xs">
            {data?.currency || "BDT"} | REAL-TIME
          </Badge>
        </div>
      </div>

      {/* Period Filter */}
      <PeriodSelector
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        onPresetChange={setPreset}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyCustomRange={loadData}
        loading={loading}
      />

      {error && (
        <Alert variant="danger" title="Failed to Load Expense Analytics">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved Expenses</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.summary.approved_amount)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Authorized operating commitments
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Disbursed Amount</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {data?.currency} {formatMoney(data?.summary.disbursed_amount)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Actually settled from cashbooks
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Balance Due / Unpaid</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
            {data?.currency} {formatMoney(data?.summary.balance_due)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Approved pending disbursement
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Voucher Count</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.summary.total_vouchers ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Operational expense vouchers
          </div>
        </Card>
      </div>

      {/* Mandatory Financing & Equity Isolation Panel */}
      <Card className="p-5 bg-emerald-50/60 border-emerald-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Financing & Equity Accounting Isolation
          </h2>
          <Badge variant="success" className="font-mono text-xs">
            P&L CONTAMINATION GUARD ACTIVE
          </Badge>
        </div>
        <p className="text-xs text-emerald-800 mb-4">
          In strict accordance with IFRS and Penguin Mart BMS financial governance, capital injections, owner drawings, and loan principal repayments are fully isolated from operating expenses to prevent net profit corruption.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-emerald-100 rounded-md">
            <div className="text-xs text-slate-500 font-medium">Owner Capital Contributions</div>
            <div className="font-mono font-bold text-slate-900 text-base mt-1">
              {data?.currency} {formatMoney(data?.financing_isolation.capital_contributions_total)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Direct Equity Credit (3000)</div>
          </div>

          <div className="p-3 bg-white border border-emerald-100 rounded-md">
            <div className="text-xs text-slate-500 font-medium">Owner Drawings / Withdrawals</div>
            <div className="font-mono font-bold text-slate-900 text-base mt-1">
              {data?.currency} {formatMoney(data?.financing_isolation.owner_drawings_total)}
            </div>
            <div className="text-[11px] text-amber-600 mt-1">Direct Equity Contra (3050)</div>
          </div>

          <div className="p-3 bg-white border border-emerald-100 rounded-md">
            <div className="text-xs text-slate-500 font-medium">Loan Principal Repayments</div>
            <div className="font-mono font-bold text-slate-900 text-base mt-1">
              {data?.currency} {formatMoney(data?.financing_isolation.loan_principal_repaid)}
            </div>
            <div className="text-[11px] text-blue-600 mt-1">Liability Reduction (2200)</div>
          </div>

          <div className="p-3 bg-white border border-emerald-100 rounded-md">
            <div className="text-xs text-slate-500 font-medium">Loan Financing Interest</div>
            <div className="font-mono font-bold text-slate-900 text-base mt-1">
              {data?.currency} {formatMoney(data?.financing_isolation.loan_interest_paid)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">Financing Cost Expense (5500)</div>
          </div>
        </div>
      </Card>

      {/* General Ledger P&L Profitability Waterfall */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            General Ledger Accrual Profitability (P&L Statement)
          </span>
          <Badge variant="muted" className="font-mono text-xs">
            STATUS: {data?.profitability.completeness_status?.toUpperCase()}
          </Badge>
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-600">Recognized Revenue (Accrual GL 4000)</span>
            <span className="font-mono font-bold text-slate-900">
              {data?.currency} {formatMoney(data?.profitability.recognized_revenue)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-600">Cost of Goods Sold (COGS GL 5000)</span>
            <span className="font-mono text-rose-600">
              - {data?.currency} {formatMoney(data?.profitability.cogs)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded text-sm font-semibold">
            <span className="text-slate-800">
              Gross Profit ({data?.profitability.gross_margin_pct ?? "0.00"}% margin)
            </span>
            <span
              className={`font-mono ${
                parseFloat(data?.profitability.gross_profit || "0") >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {data?.currency} {formatMoney(data?.profitability.gross_profit)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-600">Operating Expenses (GL 5200 series)</span>
            <span className="font-mono text-rose-600">
              - {data?.currency} {formatMoney(data?.profitability.operating_expenses)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded text-sm font-semibold">
            <span className="text-slate-800">
              Operating Profit (EBIT) ({data?.profitability.operating_margin_pct ?? "0.00"}% margin)
            </span>
            <span
              className={`font-mono ${
                parseFloat(data?.profitability.operating_profit || "0") >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {data?.currency} {formatMoney(data?.profitability.operating_profit)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 bg-indigo-50/50 px-4 rounded-lg text-base font-bold">
            <span className="text-slate-900">
              Net Profit ({data?.profitability.net_margin_pct ?? "0.00"}% net margin)
            </span>
            <span
              className={`font-mono text-lg ${
                parseFloat(data?.profitability.net_profit || "0") >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {data?.currency} {formatMoney(data?.profitability.net_profit)}
            </span>
          </div>
        </div>
      </Card>

      {/* Category Breakdown & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Spend Breakdown by Expense Category
          </h2>
          {(!data?.category_breakdown || data.category_breakdown.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No category spending recorded.</p>
          ) : (
            <div className="space-y-4">
              {data.category_breakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700">
                      {cat.name} <span className="font-mono text-xs text-slate-400">({cat.code})</span>
                    </span>
                    <span className="font-mono text-slate-900 font-medium">
                      {data.currency} {formatMoney(cat.total_spend)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-slate-400 font-mono">
                    {cat.voucher_count} voucher{cat.voucher_count !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Voucher Status Breakdown */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-600" />
            Expense Voucher Status Lifecycle
          </h2>
          {(!data?.status_breakdown || data.status_breakdown.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No expense vouchers in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Vouchers</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.status_breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <Badge
                          variant={
                            row.status === "approved" || row.status === "disbursed"
                              ? "success"
                              : row.status === "rejected"
                              ? "danger"
                              : "muted"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-700">{row.count}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-slate-900">
                        {data.currency} {formatMoney(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

