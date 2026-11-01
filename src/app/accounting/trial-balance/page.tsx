"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingPeriodInfo, TrialBalanceReport } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Scale,
  RefreshCw,
  Download,
  Printer,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function TrialBalancePage() {
  const [report, setReport] = useState<TrialBalanceReport | null>(null);
  const [periods, setPeriods] = useState<AccountingPeriodInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [asOfDate, setAsOfDate] = useState<string>("");
  const [periodId, setPeriodId] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tb, pRes] = await Promise.all([
        adminApi.getTrialBalance({
          as_of_date: asOfDate || undefined,
          period_id: periodId ? Number(periodId) : undefined,
        }),
        adminApi.getLedgerPeriods(),
      ]);
      setReport(tb);
      const list = Array.isArray(pRes) ? pRes : (pRes as any)?.results || [];
      setPeriods(list);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to generate Trial Balance report.");
      }
    } finally {
      setLoading(false);
    }
  }, [asOfDate, periodId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportCSV = () => {
    if (!report || !report.lines || report.lines.length === 0) return;
    const headers = [
      "Account Code",
      "Account Name",
      "Classification",
      "Normal Balance",
      "Total Debits",
      "Total Credits",
      "Closing Debit",
      "Closing Credit",
    ];

    const rows = report.lines.map((l) => [
      `"${l.account_code}"`,
      `"${l.account_name.replace(/"/g, '""')}"`,
      `"${l.account_type}"`,
      `"${l.normal_balance}"`,
      l.total_debit,
      l.total_credit,
      l.closing_debit,
      l.closing_credit,
    ]);

    // Totals row
    rows.push([
      `"TOTALS"`,
      `""`,
      `""`,
      `""`,
      report.total_debit,
      report.total_credit,
      report.closing_debit_total,
      report.closing_credit_total,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trial_balance_${asOfDate || new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Trial Balance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative statement of all ledger account balances verifying double-entry arithmetic equality
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} disabled={!report} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Accounting Period</label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Open / Cumulative Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.start_date} to {p.end_date}) {p.is_closed ? "[Closed]" : "[Open]"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">As of Specific Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(periodId || asOfDate) && (
            <div className="pt-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPeriodId("");
                  setAsOfDate("");
                }}
                className="text-xs text-gray-500"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Balance Verification Card */}
      {report && (
        <Card
          className={`p-5 shadow-sm border-2 ${
            report.is_balanced ? "border-emerald-500/50 bg-emerald-50/20" : "border-red-500/50 bg-red-50/20"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {report.is_balanced ? (
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                  <ShieldAlert className="h-7 w-7" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {report.is_balanced
                    ? "Equilibrium Verified: Double-Entry Equality Confirmed"
                    : "Trial Balance Imbalance Detected!"}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {report.is_balanced
                    ? `Sum of Closing Debits exactly equals Sum of Closing Credits across ${report.accounts_count} active ledger accounts.`
                    : `Discrepancy of ${formatMoney(report.difference)} detected between debit and credit columns.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 uppercase">Closing Debits</p>
                <p className="text-xl font-bold font-mono text-gray-900">
                  {formatMoney(report.closing_debit_total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 uppercase">Closing Credits</p>
                <p className="text-xl font-bold font-mono text-gray-900">
                  {formatMoney(report.closing_credit_total)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Trial Balance Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100/80 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Account Code</th>
                <th className="py-3 px-4 text-left font-semibold">Account Name</th>
                <th className="py-3 px-4 text-left font-semibold">Type</th>
                <th className="py-3 px-4 text-right font-semibold">Activity Dr</th>
                <th className="py-3 px-4 text-right font-semibold">Activity Cr</th>
                <th className="py-3 px-4 text-right font-semibold bg-gray-50/70">Closing Debit</th>
                <th className="py-3 px-4 text-right font-semibold bg-gray-50/70">Closing Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {report && report.lines && report.lines.length > 0 ? (
                report.lines.map((line) => (
                  <tr key={line.account_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-gray-900">
                      <Link
                        href={`/accounting/chart-of-accounts/${line.account_id}`}
                        className="hover:underline text-blue-600"
                      >
                        {line.account_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{line.account_name}</td>
                    <td className="py-3 px-4 capitalize text-xs text-gray-600">{line.account_type}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      {Number(line.total_debit) > 0 ? formatMoney(line.total_debit) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">
                      {Number(line.total_credit) > 0 ? formatMoney(line.total_credit) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 bg-gray-50/40">
                      {Number(line.closing_debit) > 0 ? formatMoney(line.closing_debit) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 bg-gray-50/40">
                      {Number(line.closing_credit) > 0 ? formatMoney(line.closing_credit) : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {loading ? "Calculating trial balance..." : "No posted ledger accounts found for this period."}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Grand Totals Footer */}
            <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs text-gray-800">
                  Total General Ledger Balance:
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-gray-900">
                  {report ? formatMoney(report.total_debit) : "0.00"}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-gray-900">
                  {report ? formatMoney(report.total_credit) : "0.00"}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-gray-900 bg-gray-200/50">
                  {report ? formatMoney(report.closing_debit_total) : "0.00"}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-gray-900 bg-gray-200/50">
                  {report ? formatMoney(report.closing_credit_total) : "0.00"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
