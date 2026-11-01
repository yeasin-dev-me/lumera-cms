"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CashFlowResponse, StatementLineItem } from "@/types/reporting";
import { AccountingPeriodInfo } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Coins,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Camera,
  X,
  ArrowRightLeft,
} from "lucide-react";

export default function CashFlowPage() {
  const [report, setReport] = useState<CashFlowResponse | null>(null);
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
        adminApi.getCashFlow({
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
        setError("Failed to generate Statement of Cash Flows.");
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
        statement_type: "cash_flow",
        period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cash_Flow_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export Cash Flow as CSV.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await adminApi.exportFinancialStatement("pdf", {
        statement_type: "cash_flow",
        period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cash_Flow_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export Cash Flow as PDF.");
    }
  };

  const handleTakeSnapshot = async () => {
    try {
      const snap = await adminApi.createReportSnapshot({
        statement_type: "cash_flow",
        period_id: selectedPeriodId ? Number(selectedPeriodId) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        title: `Cash Flow Snapshot - ${report?.period_name || new Date().toISOString().slice(0, 10)}`,
        notes: "Automated snapshot captured from CMS Cash Flow Cockpit",
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
              Statement of Cash Flows
            </h1>
            {report?.summary.is_reconciled ? (
              <Badge variant="muted" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Cash Reconciled
              </Badge>
            ) : (
              <Badge variant="danger">
                Variance: ৳ {formatMoney(report?.summary.variance)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Categorized cash inflows and outflows across Operating, Investing, and Financing activities with internal transfer elimination.
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
          <div className="font-semibold">Error Loading Statement of Cash Flows</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* Internal Transfers Callout */}
      {report && Number(report.summary.internal_transfers_eliminated) > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-xs text-blue-900">
              <span className="font-semibold">Internal Liquidity Transfers Eliminated: </span>
              ৳ {formatMoney(report.summary.internal_transfers_eliminated)} of journal movements between designated Cash & Bank accounts were automatically excluded to eliminate artificial gross cash inflation.
            </div>
          </div>
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
              Start Date
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
              End Date
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

      {/* Activity Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Operating Activities</div>
          <div className={`mt-1 text-2xl font-bold ${
            Number(report?.summary.operating_net) >= 0 ? "text-emerald-700" : "text-red-600"
          }`}>
            ৳ {formatMoney(report?.summary.operating_net)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Collections, Supplier Disbursements, & OpEx</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Investing Activities</div>
          <div className={`mt-1 text-2xl font-bold ${
            Number(report?.summary.investing_net) >= 0 ? "text-blue-700" : "text-red-600"
          }`}>
            ৳ {formatMoney(report?.summary.investing_net)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Fixed Assets & Capital Expenditures</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Financing Activities</div>
          <div className={`mt-1 text-2xl font-bold ${
            Number(report?.summary.financing_net) >= 0 ? "text-purple-700" : "text-red-600"
          }`}>
            ৳ {formatMoney(report?.summary.financing_net)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Capital, Loans, & Owner Drawings</div>
        </Card>
      </div>

      {/* Cash Proof Card */}
      <Card className="p-6 bg-slate-50 border border-slate-300">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Cash & Cash Equivalents Reconciliation Proof
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">Opening Cash & Equivalents</span>
            <span className="text-base font-bold text-slate-800">৳ {formatMoney(report?.summary.opening_cash)}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">Net Change in Cash</span>
            <span className="text-base font-bold text-blue-700">৳ {formatMoney(report?.summary.calculated_net_change)}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">Reconciled Closing Cash</span>
            <span className="text-base font-bold text-emerald-700">৳ {formatMoney(report?.summary.closing_cash_reconciled)}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">Actual General Ledger Cash</span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">৳ {formatMoney(report?.summary.closing_cash_actual_gl)}</span>
              {report?.summary.is_reconciled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Cash Flow Table */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Statement of Cash Flows (Direct Method)
            </h2>
            <p className="text-xs text-slate-500">
              Standard: BFRS / IFRS for SMEs | Currency: {report?.currency || "BDT"}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {report?.lines.length || 0} Cash Activity Lines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Line Code & Name</th>
                <th className="px-6 py-3">Activity</th>
                <th className="px-6 py-3">Calculation</th>
                <th className="px-6 py-3 text-right">Amount ({report?.currency || "BDT"})</th>
                <th className="px-6 py-3 text-center">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.lines.map((line) => {
                const isSubtotal = line.calculation_method === "subtotal" || line.calculation_method === "formula";
                return (
                  <tr
                    key={line.line_id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSubtotal ? "bg-slate-50 font-bold text-slate-900 border-t border-slate-200" : "text-slate-700"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{line.code}</span>
                        <span>{line.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{line.section_name}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {line.calculation_method}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-right font-mono ${
                      Number(line.amount) < 0 ? "text-red-600" : isSubtotal ? "text-slate-900" : "text-slate-800"
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

      {/* Drilldown Modal */}
      {selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Cash Contributing Accounts: {selectedLine.name}
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
