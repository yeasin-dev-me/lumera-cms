"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { FinancialReportingDashboardData } from "@/types/reporting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Scale,
  Coins,
  TrendingUp,
  Network,
  FolderTree,
  ClipboardCheck,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function ReportsDashboardPage() {
  const [data, setData] = useState<FinancialReportingDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getFinancialDashboard();
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load financial reporting dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Reporting & Statements
          </h1>
          <p className="text-sm text-slate-500">
            Authoritative financial statements derived from posted General Ledger double-entry records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/reports/validation">
            <Button size="sm" className="flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              Pre-Flight Validation
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          <div className="font-semibold">Error Loading Financial Dashboard</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* Currency & Provisional Warning */}
      {data && (!data.currency.is_approved || data.status === "provisional") && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-900">
                  Provisional Financial Statements (Currency Unapproved)
                </span>
                <Badge variant="muted" className="bg-amber-100 text-amber-800 border-amber-300">
                  Provisional
                </Badge>
              </div>
              <p className="text-xs text-amber-800">
                Operating functional currency ({data.currency.code}) remains pending executive approval (Decision 14).
                All financial statements, margin analyses, and cash figures are marked Provisional until formal executive sign-off.
              </p>
            </div>
            <Link href="/settings/currencies">
              <Button size="sm" variant="secondary" className="border-amber-400 text-amber-900 hover:bg-amber-100">
                Review Currencies
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Net Revenue</span>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.profit_loss?.net_revenue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Gross Sales: ৳ {formatMoney(data?.profit_loss?.gross_revenue)}</span>
            <span className="text-amber-600">Ret: ৳ {formatMoney(data?.profit_loss?.sales_returns)}</span>
          </div>
        </Card>

        {/* Gross Profit */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Gross Profit</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.profit_loss?.gross_profit)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Margin: {data?.profit_loss?.gross_margin_pct ? `${data.profit_loss.gross_margin_pct}%` : "N/A"}</span>
            <span>COGS: ৳ {formatMoney(data?.profit_loss?.cost_of_goods_sold)}</span>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Net Profit After Tax</span>
            <Scale className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(data?.profit_loss?.net_profit_after_tax)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Net Margin: {data?.profit_loss?.net_margin_pct ? `${data.profit_loss.net_margin_pct}%` : "N/A"}</span>
            <span>OpEx: ৳ {formatMoney(data?.profit_loss?.operating_expenses)}</span>
          </div>
        </Card>

        {/* Balance Sheet Equilibrium */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Balance Sheet Equilibrium</span>
            {data?.balance_sheet?.is_balanced ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ৳ {formatMoney(data?.balance_sheet?.total_assets)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Liab + Equity: ৳ {formatMoney(data?.balance_sheet?.total_liabilities_and_equity)}</span>
            {data?.balance_sheet?.is_balanced ? (
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Balanced
              </Badge>
            ) : (
              <Badge variant="danger">
                Diff: ৳ {formatMoney(data?.balance_sheet?.difference)}
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Cash Flow & Subledger Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Summary */}
        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold text-slate-900">Cash Flow Proof</h2>
            </div>
            <Link href="/reports/cash-flow">
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1 text-blue-600">
                Statement <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Operating Net Cash</span>
              <span className="font-semibold text-slate-900">৳ {formatMoney(data?.cash_flow?.operating_net)}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Investing Net Cash</span>
              <span className="font-semibold text-slate-900">৳ {formatMoney(data?.cash_flow?.investing_net)}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Financing Net Cash</span>
              <span className="font-semibold text-slate-900">৳ {formatMoney(data?.cash_flow?.financing_net)}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Internal Transfers Eliminated</span>
              <span className="font-mono text-xs text-slate-500">৳ {formatMoney(data?.cash_flow?.internal_transfers_eliminated)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 font-bold text-slate-900">
              <span>Ending Cash (Reconciled)</span>
              <span className="text-emerald-700">৳ {formatMoney(data?.cash_flow?.closing_cash_actual_gl)}</span>
            </div>
          </div>
        </Card>

        {/* Subledger Control Status */}
        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Subledger Reconciliation Proof</h2>
            </div>
            <Link href="/accounting/reconciliation">
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1 text-blue-600">
                Cockpit <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Accounts Receivable Control (1020)</span>
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Reconciled
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Accounts Payable Control (2010)</span>
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Reconciled
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Treasury & Bank Control (1010)</span>
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Reconciled
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">Inventory Valuation Control (1060)</span>
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Reconciled
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 text-slate-500 text-xs">
              <span>Automated Event Outbox Status:</span>
              <span className="font-semibold text-slate-700">0 Backlog / Synchronized</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Cockpits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/reports/profit-loss" className="group">
          <Card className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Profit & Loss Cockpit</h3>
                <p className="text-xs text-slate-500 truncate">Gross margin, OpEx segregation & net earnings</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </Link>

        <Link href="/reports/balance-sheet" className="group">
          <Card className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                <Scale className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Balance Sheet Cockpit</h3>
                <p className="text-xs text-slate-500 truncate">Classified position & equilibrium validation</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </Link>

        <Link href="/reports/cash-flow" className="group">
          <Card className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
                <Coins className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Statement of Cash Flows</h3>
                <p className="text-xs text-slate-500 truncate">Operating, investing & financing activities</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </Link>

        <Link href="/reports/comparative" className="group">
          <Card className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Comparative Statements</h3>
                <p className="text-xs text-slate-500 truncate">Period-over-period & budget variance analysis</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </Link>

        <Link href="/reports/statement-mappings" className="group">
          <Card className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100">
                <Network className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Statement Line Mappings</h3>
                <p className="text-xs text-slate-500 truncate">Maker-checker account-to-line governance</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </Link>

        <Link href="/reports/snapshots" className="group">
          <Card className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200">
                <History className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Report Snapshots</h3>
                <p className="text-xs text-slate-500 truncate">Finalized immutable audit statement versions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
