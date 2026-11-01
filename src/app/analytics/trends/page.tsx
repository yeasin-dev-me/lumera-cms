"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { TrendAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  Activity,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RotateCw,
  Clock,
  Calendar,
  Users,
  ShoppingBag,
  Receipt,
} from "lucide-react";

export default function TrendAnalyticsPage() {
  const [data, setData] = useState<TrendAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getTrendAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load business trends data.");
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

  const renderGrowthBadge = (growth: string | null | undefined, reverseGood: boolean = false) => {
    if (growth === null || growth === undefined) {
      return <span className="text-xs text-slate-400 font-mono">-- (Zero Baseline)</span>;
    }
    const num = parseFloat(growth);
    const isPositive = num >= 0;
    const isGood = reverseGood ? !isPositive : isPositive;
    return (
      <span
        className={`inline-flex items-center text-xs font-semibold font-mono ${
          isGood ? "text-emerald-600" : "text-rose-600"
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
            <Activity className="h-6 w-6 text-indigo-600" />
            Business Trajectory & Growth Trends
          </h1>
          <p className="text-sm text-slate-500">
            Multi-period comparative variance, growth rate calculations, working capital velocity, and historical momentum.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        <Alert variant="danger" title="Failed to Load Trends Analytics">
          {error}
        </Alert>
      )}

      {/* Prior Period Info */}
      {data?.prior_period && (
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 flex items-center justify-between">
          <span>Comparing active period ({data.period.start_date} to {data.period.end_date}) against prior period:</span>
          <span className="font-mono font-medium text-slate-700">
            {data.prior_period.start_date} to {data.prior_period.end_date}
          </span>
        </div>
      )}

      {/* Growth Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Growth */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sales Revenue Growth</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.growth_metrics.current_sales)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Prior: {data?.currency} {formatMoney(data?.growth_metrics.prior_sales)}
            </span>
            {renderGrowthBadge(data?.growth_metrics.sales_growth_pct)}
          </div>
        </Card>

        {/* Invoice Growth */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction Volume</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.growth_metrics.current_invoices ?? 0} Invoices
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Prior: {data?.growth_metrics.prior_invoices ?? 0}
            </span>
            {renderGrowthBadge(data?.growth_metrics.invoice_growth_pct)}
          </div>
        </Card>

        {/* Expense Growth */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Operating Expense Run Rate</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.growth_metrics.current_expenses)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Prior: {data?.currency} {formatMoney(data?.growth_metrics.prior_expenses)}
            </span>
            {renderGrowthBadge(data?.growth_metrics.expense_growth_pct, true)}
          </div>
        </Card>

        {/* Customer Acquisition Growth */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Acquisition</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            +{data?.growth_metrics.new_customers ?? 0} New
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Prior: +{data?.growth_metrics.prior_new_customers ?? 0}
            </span>
            {renderGrowthBadge(data?.growth_metrics.customer_growth_pct)}
          </div>
        </Card>
      </div>

      {/* Inventory Turnover & Velocity */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <RotateCw className="h-4 w-4 text-indigo-600" />
          Working Capital Velocity & Inventory Turnover
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <div className="text-xs text-slate-500 font-medium">Inventory Turnover Ratio (COGS / Avg Valuation)</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {data?.inventory_turnover.turnover_ratio !== null && data?.inventory_turnover.turnover_ratio !== undefined
                ? `${data.inventory_turnover.turnover_ratio}x`
                : "N/A (Insufficient COGS / History)"}
            </div>
            <div className="text-xs text-slate-400">
              Status: <span className="font-medium text-slate-600">{data?.inventory_turnover.status}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <div className="text-xs text-slate-500 font-medium">Days Sales of Inventory (DSI)</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {data?.inventory_turnover.days_sales_inventory !== null && data?.inventory_turnover.days_sales_inventory !== undefined
                ? `${data.inventory_turnover.days_sales_inventory} Days`
                : "N/A"}
            </div>
            <div className="text-xs text-slate-400">
              Average days required to turn current physical inventory into cash realization.
            </div>
          </div>
        </div>
      </Card>

      {/* Multi-Month Historical Trajectory Table */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          Historical Monthly Trajectory (Rolling 6-Month Timeline)
        </h2>
        {(!data?.monthly_trends || data.monthly_trends.length === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">No historical monthly data recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Month</th>
                  <th className="py-2.5">Date Range</th>
                  <th className="py-2.5 text-right">Invoices</th>
                  <th className="py-2.5 text-right">Sales Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.monthly_trends.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-900">{m.month_label}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">
                      {m.start_date} to {m.end_date}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-700">{m.invoice_count}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                      {data.currency} {formatMoney(m.sales_amount)}
                    </td>
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

