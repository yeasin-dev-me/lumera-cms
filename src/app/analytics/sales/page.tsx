"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SalesAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ShieldAlert,
  CreditCard,
  Percent,
  Receipt,
  Layers,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getSalesAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load sales analytics data.");
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

  const renderGrowthBadge = (growth: string | null | undefined) => {
    if (growth === null || growth === undefined) {
      return <span className="text-xs text-slate-400 font-mono">--</span>;
    }
    const num = parseFloat(growth);
    const isPositive = num >= 0;
    return (
      <span
        className={`inline-flex items-center text-xs font-semibold font-mono ${
          isPositive ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3 mr-0.5" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-0.5" />
        )}
        {growth}% vs prior
      </span>
    );
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
            <ShoppingBag className="h-6 w-6 text-indigo-600" />
            Sales Performance Cockpit
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative sales analytics derived directly from operational sales invoices and POS transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.currency_warning && (
            <Badge variant="warning" className="flex items-center gap-1 font-mono text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              PROVISIONAL ({data.currency_warning})
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

      {/* Error state */}
      {error && (
        <Alert variant="danger" title="Failed to Load Sales Analytics">
          {error}
        </Alert>
      )}

      {/* Distinction Banner */}
      <Alert variant="info" title="Metric Semantics Notice: Operational Sales vs Recognized Accounting Revenue">
        Sales invoice metrics represent operational billings issued to customers during the selected period.
        Net sales accounts for discounts and returns recorded in the sales domain. For accrual-based revenue recognized in the General Ledger, consult the Financial Statement Engine.
      </Alert>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.summary.gross_sales)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total invoiced value</span>
            {renderGrowthBadge(data?.comparative.growth_gross_sales_pct)}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Sales</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.summary.net_sales)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Gross minus discounts & returns</span>
            {renderGrowthBadge(data?.comparative.growth_net_sales_pct)}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.summary.invoice_count ?? 0}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              POS: {data?.summary.pos_transaction_count ?? 0}
            </span>
            {renderGrowthBadge(data?.comparative.growth_invoice_count_pct)}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Invoice Value</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.summary.average_invoice_value)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Discounts: {data?.currency} {formatMoney(data?.summary.discount_total)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Returns: {data?.currency} {formatMoney(data?.summary.sales_returns_total)}
            </span>
          </div>
        </Card>
      </div>

      {/* Channel Breakdown & Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Sales Distribution by Channel
          </h2>
          {(!data?.channel_breakdown || data.channel_breakdown.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No sales channels recorded in this period.</p>
          ) : (
            <div className="space-y-4">
              {data.channel_breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700 uppercase tracking-wider text-xs">
                      {item.channel}
                    </span>
                    <span className="font-mono text-slate-900 font-medium">
                      {data.currency} {formatMoney(item.total_amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-slate-400 font-mono">
                    {item.count} invoice{item.count !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Invoice Lifecycle Status */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            Invoice Lifecycle Status
          </h2>
          {(!data?.lifecycle || data.lifecycle.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No invoices recorded in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Invoices</th>
                    <th className="py-2.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.lifecycle.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <Badge
                          variant={
                            row.status === "paid"
                              ? "success"
                              : row.status === "posted"
                              ? "primary"
                              : row.status === "voided"
                              ? "danger"
                              : "muted"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-700">{row.count}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-slate-900">
                        {data.currency} {formatMoney(row.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Top Selling Products in Period */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-indigo-600" />
          Top Performing Products (Operational Sales)
        </h2>
        {(!data?.top_products || data.top_products.length === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">No product sales recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Rank</th>
                  <th className="py-2.5">Product Name</th>
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5 text-right">Units Sold</th>
                  <th className="py-2.5 text-right">Gross Amount</th>
                  <th className="py-2.5 text-right">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.top_products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-xs font-mono text-slate-400 font-bold">#{idx + 1}</td>
                    <td className="py-2.5 font-medium text-slate-900">{p.name}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="py-2.5 text-right font-mono font-medium text-slate-700">{p.units_sold}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                      {data.currency} {formatMoney(p.gross_amount)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-500 text-xs">
                      {data.currency} {formatMoney(p.discount_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Daily Trend Table */}
      {data?.daily_trend && data.daily_trend.length > 0 && (
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Daily Sales Trend
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5 text-right">Invoices</th>
                  <th className="py-2.5 text-right">Gross Sales</th>
                  <th className="py-2.5 text-right">Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.daily_trend.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-mono text-xs text-slate-700">{d.date}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">{d.invoice_count}</td>
                    <td className="py-2.5 text-right font-mono text-slate-900">
                      {data.currency} {formatMoney(d.gross_sales)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-emerald-600">
                      {data.currency} {formatMoney(d.net_sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

