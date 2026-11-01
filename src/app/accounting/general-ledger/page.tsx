"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Account, GeneralLedgerReport } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  Printer,
  Calendar,
  FolderTree,
} from "lucide-react";

function GeneralLedgerContent() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams?.get("account_id") || "";

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [report, setReport] = useState<GeneralLedgerReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load account list
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await adminApi.getAccounts({ is_active: true, page_size: 300 });
        const list = res.results || (res as unknown as Account[]) || [];
        setAccounts(list.filter((a) => a.allow_posting));

        // If no account selected, pick first posting account
        if (!selectedAccountId && list.length > 0) {
          const first = list.find((a) => a.allow_posting);
          if (first) {
            setSelectedAccountId(String(first.id));
          }
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    }
    fetchAccounts();
  }, []);

  const loadReport = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getGeneralLedger({
        account_id: selectedAccountId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReport(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to generate General Ledger report.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, startDate, endDate]);

  useEffect(() => {
    if (selectedAccountId) {
      loadReport();
    }
  }, [selectedAccountId, loadReport]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportCSV = () => {
    if (!report || !report.entries || report.entries.length === 0) return;
    const headers = [
      "Date",
      "Journal #",
      "Type",
      "Description",
      "Reference",
      "Debit",
      "Credit",
      "Running Balance",
    ];

    const rows = report.entries.map((e) => [
      `"${e.journal_date}"`,
      `"${e.journal_number}"`,
      `"${e.journal_type}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.reference || ""}"`,
      e.debit,
      e.credit,
      e.running_balance,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `general_ledger_${report.account?.code || "acc"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">General Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chronological account activity and real-time running balances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadReport} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} disabled={!report} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Account <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              <option value="">-- Choose Account --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.code}] {a.name} ({a.account_type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Account Summary Banner */}
      {report?.account && (
        <Card className="p-5 shadow-sm bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-blue-700">[{report.account.code}]</span>
                <h2 className="text-xl font-bold text-gray-900">{report.account.name}</h2>
              </div>
              <p className="text-xs text-gray-600 mt-1 capitalize">
                Classification: <span className="font-semibold">{report.account.account_type}</span> | Normal Balance:{" "}
                <span className="font-semibold uppercase font-mono">{report.account.normal_balance}</span>
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 uppercase">Period Debits</p>
                <p className="text-lg font-bold font-mono text-gray-900">{formatMoney(report.total_debit)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 uppercase">Period Credits</p>
                <p className="text-lg font-bold font-mono text-gray-900">{formatMoney(report.total_credit)}</p>
              </div>
              <div className="text-right pl-4 border-l border-blue-200">
                <p className="text-xs font-medium text-blue-700 uppercase">Closing Balance</p>
                <p className="text-xl font-bold font-mono text-blue-900">{formatMoney(report.closing_balance)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* General Ledger Postings Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase">
              <tr>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Journal #</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Reference</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right bg-gray-100/50">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {report && report.entries && report.entries.length > 0 ? (
                report.entries.map((entry) => (
                  <tr key={entry.line_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{entry.journal_date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600 whitespace-nowrap">
                      <Link href={`/accounting/journals/${entry.journal_id}`} className="hover:underline">
                        {entry.journal_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 capitalize text-xs text-gray-600 whitespace-nowrap">
                      {entry.journal_type.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-gray-800 max-w-xs truncate">{entry.description}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {entry.reference || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-900 whitespace-nowrap">
                      {Number(entry.debit) > 0 ? formatMoney(entry.debit) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-900 whitespace-nowrap">
                      {Number(entry.credit) > 0 ? formatMoney(entry.credit) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900 bg-gray-50/40 whitespace-nowrap">
                      {formatMoney(entry.running_balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {loading ? "Loading ledger postings..." : "No journal postings found for this account and date range."}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals Footer */}
            {report && (
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right text-xs uppercase tracking-wider text-gray-700">
                    Period Activity Totals:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-900">
                    {formatMoney(report.total_debit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-900">
                    {formatMoney(report.total_credit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-gray-900 bg-gray-100/50">
                    {formatMoney(report.closing_balance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function GeneralLedgerPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading General Ledger...</div>}>
      <GeneralLedgerContent />
    </Suspense>
  );
}

