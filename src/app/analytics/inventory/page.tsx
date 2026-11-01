"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { InventoryAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  Boxes,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Layers,
  Scale,
} from "lucide-react";

export default function InventoryAnalyticsPage() {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getInventoryAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load inventory analytics data.");
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
            <Boxes className="h-6 w-6 text-indigo-600" />
            Inventory Health & Valuation Cockpit
          </h1>
          <p className="text-sm text-slate-500">
            FIFO cost layers, physical inventory movements, GL reconciliation status, and batch expiry surveillance.
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
        <Alert variant="danger" title="Failed to Load Inventory Analytics">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stock Units</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Boxes className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {(data?.health_summary.total_stock_units ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {data?.health_summary.total_products_tracked ?? 0} catalog products
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">In-Stock Products</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {data?.health_summary.in_stock_count ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Above safety stock threshold ({data?.health_summary.low_stock_threshold ?? 5} units)
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock Warning</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
            {data?.health_summary.low_stock_count ?? 0}
          </div>
          <div className="mt-2 text-xs text-amber-700">
            Reorder threshold reached
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Out of Stock</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
              <XCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono">
            {data?.health_summary.out_of_stock_count ?? 0}
          </div>
          <div className="mt-2 text-xs text-rose-700">
            Zero warehouse availability
          </div>
        </Card>
      </div>

      {/* Valuation & GL Reconciliation and Expiry Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FIFO Valuation & GL Reconciliation */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-indigo-600" />
              FIFO Valuation & GL Reconciliation
            </span>
            {data?.valuation.is_gl_reconciled ? (
              <Badge variant="success" className="font-mono text-xs">RECONCILED</Badge>
            ) : (
              <Badge variant="warning" className="font-mono text-xs">VARIANCE FLAGGED</Badge>
            )}
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Authoritative FIFO Cost Layers:</span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {data?.currency} {formatMoney(data?.valuation.fifo_valuation)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">General Ledger Inventory Asset (1100):</span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {data?.currency} {formatMoney(data?.valuation.gl_inventory_balance)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">Reconciliation Variance:</span>
                <span
                  className={`font-mono font-bold ${
                    parseFloat(data?.valuation.reconciliation_variance || "0") === 0
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {data?.currency} {formatMoney(data?.valuation.reconciliation_variance)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-100 rounded">
                <div className="text-slate-400">Active Cost Layers</div>
                <div className="font-mono font-bold text-slate-800 text-sm mt-1">
                  {data?.valuation.active_cost_layers_count ?? 0}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded">
                <div className="text-slate-400">Unverified Products</div>
                <div className="font-mono font-bold text-slate-800 text-sm mt-1">
                  {data?.valuation.unverified_stock_products_count ?? 0}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Batch Expiry Radar */}
        <Card className="p-5 bg-white border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Batch Expiry Surveillance Radar
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Monitoring physical batch inventory lots against manufacturing and expiry lifecycle dates.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
              <div className="text-xs font-semibold text-rose-700 uppercase">Already Expired</div>
              <div className="text-2xl font-bold font-mono text-rose-900 mt-1">
                {data?.expiry_radar.expired_batches ?? 0}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">Requires immediate write-off/quarantine</div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="text-xs font-semibold text-amber-700 uppercase">Within 30 Days</div>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {data?.expiry_radar.expiring_within_30_days ?? 0}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">High clearance priority</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-slate-600 uppercase">Within 60 Days</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {data?.expiry_radar.expiring_within_60_days ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Promotion window</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-slate-600 uppercase">Within 90 Days</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {data?.expiry_radar.expiring_within_90_days ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Standard monitoring</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Movements Summary */}
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Stock Movement Journal Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only physical stock movements recorded during the period.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono mt-2 sm:mt-0">
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> Inflows: +{(data?.movements.inflow_units ?? 0).toLocaleString()}
            </span>
            <span className="flex items-center text-rose-600">
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" /> Outflows: -{(data?.movements.outflow_units ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {(!data?.movements.breakdown || data.movements.breakdown.length === 0) ? (
          <p className="text-sm text-slate-400 py-6 text-center">No movements recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Movement Type</th>
                  <th className="py-2.5 text-right">Event Count</th>
                  <th className="py-2.5 text-right">Net Quantity Delta</th>
                  <th className="py-2.5 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.movements.breakdown.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-900 uppercase text-xs">
                      {m.movement_type}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600">{m.event_count}</td>
                    <td
                      className={`py-2.5 text-right font-mono font-medium ${
                        m.quantity_delta > 0
                          ? "text-emerald-600"
                          : m.quantity_delta < 0
                          ? "text-rose-600"
                          : "text-slate-600"
                      }`}
                    >
                      {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-900">
                      {data.currency} {formatMoney(m.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Critical Stock Alerts Tables (Low Stock and Out of Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Products
            </h2>
            <Badge variant="warning">{data?.low_stock_products?.length ?? 0} Items</Badge>
          </div>
          {(!data?.low_stock_products || data.low_stock_products.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No products currently below low stock threshold.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2">Product</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2 text-right">Available Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.low_stock_products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 font-medium text-slate-900 text-xs">{p.name}</td>
                      <td className="py-2 font-mono text-xs text-slate-500">{p.sku}</td>
                      <td className="py-2 text-right font-mono font-bold text-amber-600">{p.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Out of Stock Products */}
        <Card className="p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" />
              Out of Stock Products
            </h2>
            <Badge variant="danger">{data?.out_of_stock_products?.length ?? 0} Items</Badge>
          </div>
          {(!data?.out_of_stock_products || data.out_of_stock_products.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No products are completely out of stock.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-2">Product</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2 text-right">Listed Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.out_of_stock_products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 font-medium text-slate-900 text-xs">{p.name}</td>
                      <td className="py-2 font-mono text-xs text-slate-500">{p.sku}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{data.currency} {formatMoney(p.price)}</td>
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

