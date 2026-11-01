"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExecutiveDashboardData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Truck,
  Users,
  Landmark,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  Layers,
} from "lucide-react";

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("last_30_days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getExecutiveDashboard({
        preset,
        start_date: preset === "custom" ? startDate : undefined,
        end_date: preset === "custom" ? endDate : undefined,
      });
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load executive dashboard.");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
            Executive Decision Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative executive decision-support consolidating operational subledgers and double-entry accounting.
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

      {/* Period Filter Bar */}
      <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onRefresh={loadData}
        loading={loading}
      />

      {error && (
        <Alert variant="danger">
          <div className="font-semibold">Error Loading Dashboard</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {data?.currency_warning && (
        <Alert variant="warning">
          <div className="font-semibold flex items-center gap-1.5 text-amber-800">
            <ShieldAlert className="h-4 w-4" />
            Base Operating Currency Unapproved ({data.currency})
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Functional base currency has not been approved by the business owner. Consolidated financial performance
            metrics remain labeled provisional until formal approval.
          </div>
        </Alert>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.sales?.gross_sales)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Net: ৳ {formatMoney(data?.sales?.net_sales)}</span>
            {data?.sales?.sales_growth_pct !== null && data?.sales?.sales_growth_pct !== undefined ? (
              <span className={`font-semibold ${Number(data.sales.sales_growth_pct) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {Number(data.sales.sales_growth_pct) >= 0 ? "+" : ""}
                {data.sales.sales_growth_pct}%
              </span>
            ) : (
              <span className="text-slate-400">N/A vs prior</span>
            )}
          </div>
        </Card>

        {/* Operating Treasury Balance */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Treasury Liquidity</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.treasury_and_liquidity?.operational_treasury_balance)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Collected: ৳ {formatMoney(data?.treasury_and_liquidity?.cash_collected)}</span>
            <Link href="/analytics/treasury" className="text-blue-600 hover:underline">
              Inspect &rarr;
            </Link>
          </div>
        </Card>

        {/* FIFO Inventory Valuation */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.inventory?.fifo_valuation)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Units: {data?.inventory?.total_stock_units ?? 0}</span>
            <span>
              Low: <span className="font-semibold text-amber-600">{data?.inventory?.low_stock_products_count ?? 0}</span>
            </span>
          </div>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receivables & Due</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.treasury_and_liquidity?.outstanding_receivables)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Payables Due: ৳ {formatMoney(data?.treasury_and_liquidity?.outstanding_payables)}</span>
            <Link href="/analytics/customers" className="text-purple-600 hover:underline">
              Aging &rarr;
            </Link>
          </div>
        </Card>
      </div>

      {/* Accounting Performance vs Operational Sales Distinction Banner */}
      <Card className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-0 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/20">
                Authoritative Distinction
              </span>
              <span className="text-xs text-slate-400">Step 11 Architecture Principle</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Operational Sales vs Recognized Accounting Revenue
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Operational sales track invoiced commercial orders. Accounting revenue reflects posted, double-entry
              General Ledger income statement recognition.
            </p>
          </div>
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-400">Operational Gross Sales</div>
              <div className="text-xl font-mono font-bold text-indigo-400">৳ {formatMoney(data?.sales?.gross_sales)}</div>
              <div className="text-xs text-slate-400">{data?.sales?.invoice_count ?? 0} Invoices</div>
            </div>
            <div className="text-slate-600">&rarr;</div>
            <div>
              <div className="text-xs text-slate-400">P&L Recognized Revenue</div>
              <div className="text-xl font-mono font-bold text-emerald-400">৳ {formatMoney(data?.financial_performance?.recognized_revenue)}</div>
              <div className="text-xs text-slate-400">Status: {data?.financial_performance?.completeness_status || "Provisional"}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Accounting Performance & Net Profit Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 bg-white border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              General Ledger Profitability Statement
            </h3>
            <Link href="/analytics/expenses" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              Deep-Dive Statement &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Net Revenue</div>
              <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                ৳ {formatMoney(data?.financial_performance?.recognized_revenue)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Allocated COGS</div>
              <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                ৳ {formatMoney(data?.financial_performance?.cogs)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Gross Profit</div>
              <div className="text-base font-bold text-emerald-600 mt-1 font-mono">
                ৳ {formatMoney(data?.financial_performance?.gross_profit)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Margin: {data?.financial_performance?.gross_margin_pct ?? "0.0"}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Operating Profit</div>
              <div className="text-base font-bold text-indigo-600 mt-1 font-mono">
                ৳ {formatMoney(data?.financial_performance?.operating_profit)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Margin: {data?.financial_performance?.operating_margin_pct ?? "0.0"}%
              </div>
            </div>
          </div>
        </Card>

        {/* Actionable Alerts Widget */}
        <Card className="p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-600" />
              Actionable Alerts
            </h3>
            <Link href="/analytics/alerts" className="text-xs font-semibold text-rose-600 hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="space-y-2.5">
            {data?.alerts_summary?.top_alerts?.length ? (
              data.alerts_summary.top_alerts.map((al) => (
                <div key={al.id} className="p-2.5 rounded border border-slate-100 bg-slate-50/50 flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      al.severity === "critical"
                        ? "bg-rose-500"
                        : al.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{al.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{al.message}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No active critical or warning alerts.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Domain Navigation Cockpits Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Specialized Analytics Cockpits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/analytics/sales" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Sales Performance
                    </h4>
                    <p className="text-xs text-slate-500">Channels, daily trends & returns</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/products" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Product Intelligence
                    </h4>
                    <p className="text-xs text-slate-500">Top selling items & non-moving stock</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/inventory" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Inventory Health & Valuation
                    </h4>
                    <p className="text-xs text-slate-500">FIFO layers, stock levels & expiry radar</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/procurement" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      Procurement & Suppliers
                    </h4>
                    <p className="text-xs text-slate-500">PO fulfillment & vendor spend ranking</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/customers" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      Customer Intelligence
                    </h4>
                    <p className="text-xs text-slate-500">Repeat buyer rate, segments & receivables</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/treasury" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Treasury & Liquidity
                    </h4>
                    <p className="text-xs text-slate-500">Account cashbooks, inflows & settlement</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/expenses" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      Expenses & Profitability
                    </h4>
                    <p className="text-xs text-slate-500">Voucher categories & financing isolation</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/trends" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-50 text-cyan-600 rounded">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      Business Trends & Turnover
                    </h4>
                    <p className="text-xs text-slate-500">Comparative growth & inventory turnover</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/analytics/alerts" className="group">
            <Card className="p-4 bg-white border border-slate-200 hover:border-indigo-400 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      Alerts Engine & Rules
                    </h4>
                    <p className="text-xs text-slate-500">Lifecycle management & rule thresholds</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
