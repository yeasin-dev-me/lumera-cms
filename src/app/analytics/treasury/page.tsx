"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { TreasuryAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  Landmark,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  Building2,
  Smartphone,
  Layers,
  Clock,
} from "lucide-react";

export default function TreasuryAnalyticsPage() {
  const [data, setData] = useState<TreasuryAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getTreasuryAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load treasury analytics data.");
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

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "bank":
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case "mfs":
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      default:
        return <Wallet className="h-4 w-4 text-emerald-600" />;
    }
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
            <Landmark className="h-6 w-6 text-indigo-600" />
            Treasury & Liquidity Cockpit
          </h1>
          <p className="text-sm text-slate-500">
            Real-time cash, bank, and mobile financial services (MFS) balances, transaction cashflows, and settlement status.
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
        <Alert variant="danger" title="Failed to Load Treasury Analytics">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Liquidity</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.balances.total_operational_balance)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {data?.balances.accounts?.length ?? 0} active financial accounts
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Period Cash Inflows</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {data?.currency} {formatMoney(data?.cash_movements.inflows_total)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {data?.cash_movements.inflows_count ?? 0} finalized deposit events
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Period Cash Outflows</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono">
            {data?.currency} {formatMoney(data?.cash_movements.outflows_total)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {data?.cash_movements.outflows_count ?? 0} finalized withdrawal/disbursement events
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Cash Movement</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono ${
              parseFloat(data?.cash_movements.net_cash_movement || "0") >= 0
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {data?.currency} {formatMoney(data?.cash_movements.net_cash_movement)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Inflows minus outflows in period
          </div>
        </Card>
      </div>

      {/* Account Type Balances & Settlement Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balances by Account Type */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data?.balances.by_type?.map((bt, idx) => (
              <Card key={idx} className="p-4 bg-white border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                    {getAccountTypeIcon(bt.account_type)}
                    {bt.account_type}
                  </span>
                  <Badge variant="muted">{bt.account_count} Accts</Badge>
                </div>
                <div className="mt-2 text-lg font-bold font-mono text-slate-900">
                  {data.currency} {formatMoney(bt.total_balance)}
                </div>
              </Card>
            ))}
          </div>

          {/* Individual Financial Accounts Table */}
          <Card className="p-5 bg-white border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-indigo-600" />
              Financial Accounts Authoritative Balances
            </h2>
            {(!data?.balances.accounts || data.balances.accounts.length === 0) ? (
              <p className="text-sm text-slate-400 py-6 text-center">No accounts configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                      <th className="py-2.5">Account Name</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5 text-right">Operational Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.balances.accounts.map((acc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-900">{acc.name}</td>
                        <td className="py-2.5 text-xs">
                          <span className="inline-flex items-center gap-1 uppercase font-semibold text-slate-600">
                            {getAccountTypeIcon(acc.account_type)}
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          {acc.currency} {formatMoney(acc.current_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Pending Settlements Widget */}
        <Card className="p-5 bg-white border-slate-200 h-fit">
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Gateway / MFS Settlements
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Aggregated customer card and MFS settlements pending batch finalization into cashbook accounts.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-amber-800 uppercase">Pending Batches</div>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {data?.settlements.pending_batches_count ?? 0}
            </div>
            <div className="text-xs text-amber-700">
              Total value: <span className="font-mono font-bold">{data?.currency} {formatMoney(data?.settlements.pending_batches_amount)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Movement Sources Inflow vs Outflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflow Sources */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            Cash Inflow Sources
          </h2>
          {(!data?.cash_movements.inflow_sources || data.cash_movements.inflow_sources.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No cash inflows in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2">Source Type</th>
                    <th className="py-2 text-right">Transactions</th>
                    <th className="py-2 text-right">Total Inflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cash_movements.inflow_sources.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 font-medium text-slate-900 text-xs uppercase">{s.source_type}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{s.count}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-600">
                        {data.currency} {formatMoney(s.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Outflow Sources */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
            Cash Outflow Destinations
          </h2>
          {(!data?.cash_movements.outflow_sources || data.cash_movements.outflow_sources.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No cash outflows in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2">Destination Type</th>
                    <th className="py-2 text-right">Transactions</th>
                    <th className="py-2 text-right">Total Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cash_movements.outflow_sources.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 font-medium text-slate-900 text-xs uppercase">{s.source_type}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{s.count}</td>
                      <td className="py-2 text-right font-mono font-bold text-rose-600">
                        {data.currency} {formatMoney(s.total)}
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

