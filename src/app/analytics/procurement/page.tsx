"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ProcurementAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  Truck,
  ArrowLeft,
  FileCheck,
  Receipt,
  Layers,
  Building,
  CheckCircle,
  Percent,
} from "lucide-react";

export default function ProcurementAnalyticsPage() {
  const [data, setData] = useState<ProcurementAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getProcurementAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load procurement analytics data.");
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
            <Truck className="h-6 w-6 text-indigo-600" />
            Procurement & Supplier Intelligence Cockpit
          </h1>
          <p className="text-sm text-slate-500">
            Purchase order execution, goods receiving fulfillment, landed cost allocation, and supplier concentration.
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
        <Alert variant="danger" title="Failed to Load Procurement Analytics">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved PO Value</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <FileCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.purchase_orders.approved_value)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Total committed: {data?.currency} {formatMoney(data?.purchase_orders.total_value)}
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fulfillment Rate</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {data?.purchase_orders.fulfillment_rate_pct ?? 0}%
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono">
            {data?.purchase_orders.received_quantity ?? 0} / {data?.purchase_orders.ordered_quantity ?? 0} units received
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Billed Spend</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.purchase_bills.total_billed)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {data?.purchase_bills.total_count ?? 0} supplier purchase bills
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Landed Costs Added</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.currency} {formatMoney(data?.purchase_bills.total_landed_costs)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Capitalized into FIFO unit costs
          </div>
        </Card>
      </div>

      {/* PO Status Breakdown & Fulfillment Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PO Status Lifecycle */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            Purchase Order Pipeline
          </h2>
          {(!data?.purchase_orders.status_breakdown || data.purchase_orders.status_breakdown.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No purchase orders in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Orders</th>
                    <th className="py-2.5 text-right">Committed Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.purchase_orders.status_breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <Badge
                          variant={
                            row.status === "approved" || row.status === "received"
                              ? "success"
                              : row.status === "cancelled"
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

        {/* Fulfillment Summary & Progress */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Receiving & Landed Cost Synthesis
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="font-medium text-slate-700">Physical Goods Fulfillment Rate</span>
                <span className="font-mono font-bold text-slate-900">
                  {data?.purchase_orders.fulfillment_rate_pct ?? 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, data?.purchase_orders.fulfillment_rate_pct ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
                <span>Received: {data?.purchase_orders.received_quantity ?? 0}</span>
                <span>Ordered: {data?.purchase_orders.ordered_quantity ?? 0}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Posted Bills Value:</span>
                <span className="font-mono font-bold text-slate-900">
                  {data?.currency} {formatMoney(data?.purchase_bills.posted_bills_value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Landed Cost Overhead:</span>
                <span className="font-mono font-bold text-slate-900">
                  {data?.currency} {formatMoney(data?.purchase_bills.total_landed_costs)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Supplier Spend Concentration */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building className="h-4 w-4 text-indigo-600" />
          Supplier Spend Concentration
        </h2>
        {(!data?.supplier_concentration || data.supplier_concentration.length === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">No supplier spend recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Supplier</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5 text-right">Purchase Bills</th>
                  <th className="py-2.5 text-right">Total Spend</th>
                  <th className="py-2.5 text-right w-48">Spend Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.supplier_concentration.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-900">{s.name}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">{s.code}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">{s.bill_count}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                      {data.currency} {formatMoney(s.total_spend)}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, s.spend_percentage)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-600 font-medium">
                          {s.spend_percentage}%
                        </span>
                      </div>
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

