"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ProductAnalyticsData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  Package,
  ArrowLeft,
  ShieldAlert,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Tag,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function ProductAnalyticsPage() {
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getProductAnalytics({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load product analytics data.");
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
            <Package className="h-6 w-6 text-indigo-600" />
            Product Velocity & Movement Intelligence
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative product performance, sales velocity, average realization price, and non-moving stock diagnostics.
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

      {error && (
        <Alert variant="danger" title="Failed to Load Product Analytics">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Catalog Products</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.summary.total_products_tracked ?? 0}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">
              {data?.summary.active_products_count ?? 0} Active
            </span>
            <span className="text-slate-400">
              {data?.summary.inactive_products_count ?? 0} Inactive
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Products With Sales</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {data?.summary.products_with_sales_in_period ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {data?.summary.total_products_tracked
              ? Math.round(
                  ((data.summary.products_with_sales_in_period || 0) /
                    data.summary.total_products_tracked) *
                    100
                )
              : 0}
            % of catalog active in period
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Zero Sales Products</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <AlertOctagon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
            {data?.summary.products_without_sales_in_period ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Dormant inventory candidates in period
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Top Velocity Items</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {data?.top_products?.length ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Ranked by gross invoice realization
          </div>
        </Card>
      </div>

      {/* Top Performing Ranked Table */}
      <Card className="p-5 bg-white border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Top Velocity Products (Ranked by Sales Revenue)
        </h2>
        {(!data?.top_products || data.top_products.length === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">No product sales in the selected period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Rank</th>
                  <th className="py-2.5">Product Name</th>
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5 text-right">Invoices</th>
                  <th className="py-2.5 text-right">Units Sold</th>
                  <th className="py-2.5 text-right">Avg Realized Price</th>
                  <th className="py-2.5 text-right">Total Discount</th>
                  <th className="py-2.5 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.top_products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-xs font-mono font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 font-medium text-slate-900">{p.name}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">{p.invoice_count}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-800">{p.units_sold}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">
                      {data.currency} {formatMoney(p.average_selling_price)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400 text-xs">
                      {data.currency} {formatMoney(p.total_discount)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                      {data.currency} {formatMoney(p.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Non-Moving Products Table */}
      <Card className="p-5 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-amber-500" />
              Non-Moving / Zero-Sales Inventory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active catalog items with stock in warehouse but zero invoices generated in this period.
            </p>
          </div>
          <Badge variant="warning" className="font-mono text-xs self-start sm:self-auto mt-2 sm:mt-0">
            {data?.non_moving_products?.length ?? 0} Dormant Items
          </Badge>
        </div>

        {(!data?.non_moving_products || data.non_moving_products.length === 0) ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            All stocked products have recorded sales activity in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Product Name</th>
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5 text-right">Current Stock Qty</th>
                  <th className="py-2.5 text-right">Listed Price</th>
                  <th className="py-2.5 text-right">Est. Tied Capital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.non_moving_products.map((p, idx) => {
                  const estCapital = p.stock_quantity * parseFloat(p.listed_price || "0");
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-900">{p.name}</td>
                      <td className="py-2.5 font-mono text-xs text-slate-500">{p.sku}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-slate-700">
                        {p.stock_quantity}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        {data.currency} {formatMoney(p.listed_price)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium text-amber-700">
                        {data.currency} {formatMoney(estCapital)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

