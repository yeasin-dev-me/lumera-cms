"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { JournalEntry, JournalStatus, JournalType } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  History,
  RefreshCw,
  Download,
  Printer,
  Search,
  Filter,
  Receipt,
} from "lucide-react";

export default function JournalRegisterPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("posted");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getJournals({
        status: statusFilter || undefined,
        journal_type: typeFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: searchQuery || undefined,
        page_size: 100,
      });
      setJournals(res.results || (res as unknown as JournalEntry[]) || []);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load journal register.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, startDate, endDate, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeVariant = (status: JournalStatus) => {
    switch (status) {
      case "posted":
        return "success";
      case "approved":
        return "accent";
      case "pending_approval":
        return "warning";
      case "draft":
        return "muted";
      case "rejected":
      case "cancelled":
        return "danger";
      default:
        return "muted";
    }
  };

  const handleExportCSV = () => {
    if (journals.length === 0) return;
    const headers = [
      "Journal #",
      "Date",
      "Type",
      "Status",
      "Description",
      "Reference",
      "Line #",
      "Account Code",
      "Account Name",
      "Line Memo",
      "Debit",
      "Credit",
    ];

    const rows: string[][] = [];
    journals.forEach((j) => {
      if (j.lines && j.lines.length > 0) {
        j.lines.forEach((l) => {
          rows.push([
            `"${j.journal_number}"`,
            `"${j.journal_date}"`,
            `"${j.journal_type}"`,
            `"${j.status}"`,
            `"${j.description.replace(/"/g, '""')}"`,
            `"${j.reference || ""}"`,
            String(l.line_number),
            `"${l.account_code}"`,
            `"${l.account_name.replace(/"/g, '""')}"`,
            `"${(l.description || "").replace(/"/g, '""')}"`,
            l.debit,
            l.credit,
          ]);
        });
      } else {
        rows.push([
          `"${j.journal_number}"`,
          `"${j.journal_date}"`,
          `"${j.journal_type}"`,
          `"${j.status}"`,
          `"${j.description.replace(/"/g, '""')}"`,
          `"${j.reference || ""}"`,
          "",
          "",
          "",
          "",
          j.total_debit,
          j.total_credit,
        ]);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Journal Register</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chronological audit log and multi-line register of all journal transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} disabled={journals.length === 0} className="gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search #, ref, memo..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="posted">Posted Only</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="draft">Drafts</option>
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
          >
            <option value="">All Journal Types</option>
            <option value="general">General Journal</option>
            <option value="adjustment">Adjustment</option>
            <option value="opening_balance">Opening Balance</option>
            <option value="closing">Closing</option>
            <option value="reversal">Reversal</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Journal Cards with Embedded Lines */}
      <div className="space-y-4">
        {journals.length > 0 ? (
          journals.map((j) => (
            <Card key={j.id} className="overflow-hidden shadow-sm">
              {/* Journal Card Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/accounting/journals/${j.id}`}
                    className="font-mono font-bold text-sm text-blue-600 hover:underline"
                  >
                    {j.journal_number}
                  </Link>
                  <span className="text-xs text-gray-500">{j.journal_date}</span>
                  <span className="text-xs capitalize font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {j.journal_type.replace("_", " ")}
                  </span>
                  <Badge variant={getStatusBadgeVariant(j.status)}>
                    {j.status.replace("_", " ")}
                  </Badge>
                  {j.is_reversed && (
                    <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-semibold border border-rose-200">
                      REVERSED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">
                    By: <strong className="text-gray-800">{j.posted_by_name || j.created_by_name || "System"}</strong>
                  </span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {formatMoney(j.total_debit)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 py-2 bg-white text-xs text-gray-700 border-b border-gray-100 flex items-center justify-between">
                <span>
                  Memo: <span className="font-medium text-gray-900">{j.description}</span>
                </span>
                {j.reference && (
                  <span className="text-gray-500 font-mono">
                    Ref: <strong>{j.reference}</strong>
                  </span>
                )}
              </div>

              {/* Lines Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead className="bg-gray-100/50 text-gray-500 font-medium">
                    <tr>
                      <th className="py-2 px-4 text-left w-12">#</th>
                      <th className="py-2 px-4 text-left w-32">Account</th>
                      <th className="py-2 px-4 text-left">Title</th>
                      <th className="py-2 px-4 text-left">Line Memo</th>
                      <th className="py-2 px-4 text-right w-36">Debit ({j.currency})</th>
                      <th className="py-2 px-4 text-right w-36">Credit ({j.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {j.lines && j.lines.length > 0 ? (
                      j.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-4 text-gray-400 font-mono">{l.line_number}</td>
                          <td className="py-2 px-4 font-mono font-semibold text-gray-900">{l.account_code}</td>
                          <td className="py-2 px-4 text-gray-800">{l.account_name}</td>
                          <td className="py-2 px-4 text-gray-500">{l.description || "—"}</td>
                          <td className="py-2 px-4 text-right font-mono text-gray-900">
                            {Number(l.debit) > 0 ? formatMoney(l.debit) : "—"}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-gray-900">
                            {Number(l.credit) > 0 ? formatMoney(l.credit) : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-2 px-4 text-center text-gray-400">
                          No line items recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center text-gray-400">
            {loading ? "Loading journal register..." : "No journal records found matching criteria."}
          </Card>
        )}
      </div>
    </div>
  );
}

