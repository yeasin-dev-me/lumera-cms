"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ComparativeStatementResponse, StatementType } from "@/types/reporting";
import { AccountingPeriodInfo } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
} from "lucide-react";

export default function ComparativeStatementsPage() {
  const [statementType, setStatementType] = useState<StatementType>("profit_and_loss");
  const [comparisonType, setComparisonType] = useState<string>("prior_period");
  const [periods, setPeriods] = useState<AccountingPeriodInfo[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>("");
  const [priorPeriodId, setPriorPeriodId] = useState<string>("");
  const [report, setReport] = useState<ComparativeStatementResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, pList] = await Promise.all([
        adminApi.getComparativeStatement({
          statement_type: statementType,
          comparison_type: comparisonType,
          current_period_id: currentPeriodId ? Number(currentPeriodId) : undefined,
          comparison_period_id: priorPeriodId ? Number(priorPeriodId) : undefined,
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
        setError("Failed to generate Comparative Statement.");
      }
    } finally {
      setLoading(false);
    }
  }, [statementType, comparisonType, currentPeriodId, priorPeriodId]);

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
            Comparative Statement Analysis
          </h1>
          <p className="text-sm text-slate-500">
            Period-over-period variance analysis and percentage trends with mathematical zero-baseline guards.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="danger">
          <div className="font-semibold">Error Loading Comparative Report</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* Control Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Statement Type
            </label>
            <select
              value={statementType}
              onChange={(e) => setStatementType(e.target.value as StatementType)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="profit_and_loss">Profit & Loss Statement</option>
              <option value="balance_sheet">Classified Balance Sheet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Comparison Mode
            </label>
            <select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="prior_period">Sequential Prior Period</option>
              <option value="prior_year">Same Period Prior Year</option>
              <option value="custom_period">Custom Specific Period</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Current Period
            </label>
            <select
              value={currentPeriodId}
              onChange={(e) => setCurrentPeriodId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Latest Period</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fiscal_year_name} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Comparison Period
            </label>
            <select
              value={priorPeriodId}
              onChange={(e) => setPriorPeriodId(e.target.value)}
              disabled={comparisonType !== "custom_period"}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Automated by Mode</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fiscal_year_name} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {report?.title || "Comparative Statement"}
            </h2>
            <p className="text-xs text-slate-500">
              Current: {report?.current_label || "Current"} vs Comparison: {report?.comparison_label || "Prior"} | Currency: {report?.currency || "BDT"}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {report?.lines.length || 0} Comparative Lines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Statement Line</th>
                <th className="px-6 py-3 text-right">{report?.current_label || "Current"}</th>
                <th className="px-6 py-3 text-right">{report?.comparison_label || "Prior"}</th>
                <th className="px-6 py-3 text-right">Variance (BDT)</th>
                <th className="px-6 py-3 text-right">Change (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.lines.map((line) => {
                const diff = Number(line.absolute_variance);
                const isPositive = diff > 0;
                const isNegative = diff < 0;

                return (
                  <tr key={line.code} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-slate-400 mr-2">{line.code}</span>
                      <span className="font-medium text-slate-800">{line.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900">
                      {formatMoney(line.current_amount)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-600">
                      {formatMoney(line.prior_amount)}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-mono font-semibold ${
                      isPositive ? "text-emerald-700" : isNegative ? "text-red-600" : "text-slate-500"
                    }`}>
                      {isPositive ? "+" : ""}{formatMoney(line.absolute_variance)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono">
                      <div className="inline-flex items-center gap-1">
                        {isPositive ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                        ) : isNegative ? (
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span className={`text-xs font-bold ${
                          line.percentage_variance.includes("N/A")
                            ? "text-slate-400"
                            : isPositive
                            ? "text-emerald-700"
                            : isNegative
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}>
                          {line.percentage_variance}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
