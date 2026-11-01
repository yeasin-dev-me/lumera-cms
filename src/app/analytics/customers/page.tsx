"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CustomerAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  Users,
  ArrowLeft,
  UserCheck,
  RotateCcw,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Layers,
  Phone,
} from "lucide-react";

export default function CustomerAnalyticsPage() {
  const [data, setData] = useState<CustomerAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getCustomerAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load customer analytics data.");
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
            <Users className="h-6 w-6 text-indigo-600" />
            Customer Intelligence & Receivables Cockpit
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative buyer lifecycle, repeat purchase velocity, segment distribution, and customer receivables exposure.
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
        <Alert variant="danger" title="Failed to Load Customer Analytics">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customers</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.summary.total_customers ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            +{data?.summary.new_customers_count ?? 0} new acquired in period
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Buyers</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {data?.summary.active_buyers_count ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Invoiced during selected period
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Repeat Purchase Rate</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <RotateCcw className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 font-mono">
            {data?.summary.repeat_purchase_rate_pct ?? 0}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {data?.summary.repeat_buyers_count ?? 0} multi-order customers
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Receivables</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.receivables.total_outstanding)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Subledger outstanding balance
          </div>
        </Card>
      </div>

      {/* Segmentation & Receivables Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segmentation */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Customer Segment Distribution
          </h2>
          {(!data?.segments || data.segments.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No customer segments identified.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2.5">Segment Type</th>
                    <th className="py-2.5 text-right">Customer Count</th>
                    <th className="py-2.5 text-right">Outstanding Receivables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.segments.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-900 uppercase text-xs">
                        {s.segment}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-700">{s.count}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-slate-900">
                        {data.currency} {formatMoney(s.total_receivables)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Credit Exposure Diagnostics */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            Credit Exposure & Receivables Limits
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Approved Credit Limits:</span>
                <span className="font-mono font-bold text-slate-900">
                  {data?.currency} {formatMoney(data?.receivables.total_credit_limit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Total Outstanding Receivables:</span>
                <span className="font-mono font-bold text-amber-700">
                  {data?.currency} {formatMoney(data?.receivables.total_outstanding)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-slate-500">Credit Approved Accounts</div>
                <div className="font-mono font-bold text-emerald-600 text-lg mt-1">
                  {data?.receivables.credit_approved_customers ?? 0}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-slate-500">Credit Suspended Accounts</div>
                <div className="font-mono font-bold text-rose-600 text-lg mt-1">
                  {data?.receivables.suspended_customers ?? 0}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Customers by Spend Table */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Top Customers by Revenue Contribution
        </h2>
        {(!data?.top_customers || data.top_customers.length === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">No customer purchases in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Rank</th>
                  <th className="py-2.5">Customer Name</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Phone</th>
                  <th className="py-2.5 text-right">Invoices</th>
                  <th className="py-2.5 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.top_customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-xs font-mono font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 font-medium text-slate-900">{c.name}</td>
                    <td className="py-2.5 text-xs uppercase">
                      <Badge variant="muted">{c.customer_type}</Badge>
                    </td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">{c.phone || "--"}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">{c.invoice_count}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                      {data.currency} {formatMoney(c.total_spend)}
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

