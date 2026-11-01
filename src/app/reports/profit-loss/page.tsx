"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ProfitLossResponse, StatementLineItem } from "@/types/reporting";
import { AccountingPeriodInfo } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Scale,
  Calendar,
  X,
  Camera,
} from "lucide-react";

export default function ProfitLossPage() {
  const [report, setReport] = useState<ProfitLossResponse | null>(null);
  const [periods, setPeriods] = useState<AccountingPeriodInfo[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<StatementLineItem | null>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, pList] = await Promise.all([
        adminApi.getProfitLoss({
          period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        adminApi.getLedgerPeriods(),
      ]);
      setReport(res);
      const list = Array.isArray(pList) ? pList : (pList as any)?.results || [];
      setPeriods(list);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to generate Profit & Loss Statement.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, startDate, endDate]);

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

  const handleExportCSV = async () => {
    try {
      const blob = await adminApi.exportFinancialStatement("csv", {
        statement_type: "profit_and_loss",
        period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Profit_and_Loss_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export statement as CSV.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await adminApi.exportFinancialStatement("pdf", {
        statement_type: "profit_and_loss",
        period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Profit_and_Loss_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export statement as PDF.");
    }
  };

  const handleTakeSnapshot = async () => {
    try {
      const snap = await adminApi.createReportSnapshot({
        statement_type: "profit_and_loss",
        period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        title: `P&L Snapshot - ${report?.period_name || new Date().toISOString().slice(0, 10)}`,
        notes: "Automated snapshot captured from CMS Profit & Loss Cockpit",
      });
      setSnapshotSuccess(`Report snapshot #${snap.snapshot_number} successfully saved.`);
      setTimeout(() => setSnapshotSuccess(null), 5000);
    } catch {
      alert("Failed to save report snapshot.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Profit & Loss Statement
            </h1>
            {report?.status === "complete" ? (
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Complete
              </Badge>
            ) : (
              <Badge variant="muted" className="bg-amber-50 text-amber-800 border-amber-300">
                Provisional
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Statement of Financial Performance showing revenue, gross margin, operating expenses, and net earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleTakeSnapshot}>
            <Camera className="h-4 w-4 mr-1.5" />
            Snapshot
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            CSV
          </Button>
          <Button size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      {snapshotSuccess && (
        <Alert variant="success" className="border-emerald-300 bg-emerald-50 text-emerald-800">
          {snapshotSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          <div className="font-semibold">Error Loading Statement</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* Warnings Banner */}
      {report && report.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
          {report.warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{w.code}:</span> {w.message}
                {w.action_required && <span className="block text-amber-700 font-medium mt-0.5">Action: {w.action_required}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Accounting Period
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => {
                setSelectedPeriodId(e.target.value);
                setStartDate("");
                setEndDate("");
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Open & Closed Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fiscal_year_name} — {p.name} ({p.start_date} to {p.end_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Custom Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedPeriodId("");
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Custom End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedPeriodId("");
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Gross Revenue</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            ৳ {formatMoney(report?.summary.gross_revenue)}
          </div>
          <div className="mt-1 text-xs text-amber-600">
            Returns & Allowances: ৳ {formatMoney(report?.summary.sales_returns)}
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Net Revenue</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            ৳ {formatMoney(report?.summary.net_revenue)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            COGS: ৳ {formatMoney(report?.summary.cost_of_goods_sold)}
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Gross Profit</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">
            ৳ {formatMoney(report?.summary.gross_profit)}
          </div>
          <div className="mt-1 text-xs font-medium text-blue-600">
            Gross Margin: {report?.summary.gross_margin_pct ? `${report.summary.gross_margin_pct}%` : "N/A"}
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Net Profit After Tax</div>
          <div className="mt-1 text-2xl font-bold text-purple-700">
            ৳ {formatMoney(report?.summary.net_profit_after_tax)}
          </div>
          <div className="mt-1 text-xs font-medium text-purple-600">
            Net Margin: {report?.summary.net_margin_pct ? `${report.summary.net_margin_pct}%` : "N/A"}
          </div>
        </Card>
      </div>

      {/* Main Statement Table */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Profit & Loss Statement (Income Statement)
            </h2>
            <p className="text-xs text-slate-500">
              Currency: {report?.currency || "BDT"} | Standard: BFRS / IFRS for SMEs
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {report?.lines.length || 0} Line Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Statement Line</th>
                <th className="px-6 py-3">Section</th>
                <th className="px-6 py-3">Calculation</th>
                <th className="px-6 py-3 text-right">Amount ({report?.currency || "BDT"})</th>
                <th className="px-6 py-3 text-center">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {report?.lines.map((line) => {
                const isFormula = line.calculation_method === "formula" || line.calculation_method === "subtotal";
                const isMajorTotal = ["REV_NET", "PL_GROSS_PROFIT", "PL_OPERATING_PROFIT", "PL_NET_AFTER_TAX"].includes(line.code);

                return (
                  <tr
                    key={line.line_id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isMajorTotal
                        ? "bg-slate-50/70 font-bold text-slate-900 border-t-2 border-slate-300"
                        : isFormula
                        ? "font-semibold text-slate-800"
                        : "text-slate-700"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{line.code}</span>
                        <span className={line.sort_order % 10 === 0 && !isMajorTotal ? "pl-2" : ""}>
                          {line.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{line.section_name}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {line.calculation_method}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-right font-mono ${
                      Number(line.amount) < 0 ? "text-red-600" : isMajorTotal ? "text-slate-900" : "text-slate-800"
                    }`}>
                      {formatMoney(line.amount)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {line.contributing_accounts && line.contributing_accounts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLine(line)}
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {line.contributing_accounts.length} Accs <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drill-Down Modal */}
      {selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Line Drill-Down: {selectedLine.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Code: {selectedLine.code}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLine(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contributing General Ledger Accounts
              </div>
              <div className="border rounded-lg overflow-hidden divide-y divide-slate-100">
                {selectedLine.contributing_accounts?.map((acc) => (
                  <div key={acc.account_id} className="flex justify-between items-center p-3 text-sm">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700 mr-2">{acc.code}</span>
                      <span className="text-slate-900">{acc.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">
                      ৳ {formatMoney(acc.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-sm">
                <span>Total Line Amount</span>
                <span className="text-blue-700">৳ {formatMoney(selectedLine.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedLine(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
