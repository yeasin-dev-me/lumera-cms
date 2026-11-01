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
  Receipt,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getJournals({
        status: statusFilter || undefined,
        journal_type: typeFilter || undefined,
        search: searchQuery || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page_size: 50,
      });
      setJournals(res.results || (res as unknown as JournalEntry[]) || []);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load journal entries.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, startDate, endDate]);

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

  const statusTabs = [
    { label: "All Vouchers", value: "" },
    { label: "Drafts", value: "draft" },
    { label: "Pending Approval", value: "pending_approval" },
    { label: "Approved (Ready)", value: "approved" },
    { label: "Posted (GL)", value: "posted" },
    { label: "Rejected / Cancelled", value: "rejected" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-500 mt-1">
            General journal vouchers, maker-checker authorization lifecycle, and immutable posting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/accounting/journals/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Journal Entry
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Status Filter Tabs */}
      <div className="flex items-center border-b border-gray-200 overflow-x-auto gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search #, ref, or memo..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
          >
            <option value="">All Journal Types</option>
            <option value="general">General Journal</option>
            <option value="adjustment">Adjustment</option>
            <option value="opening_balance">Opening Balance</option>
            <option value="closing">Closing Journal</option>
            <option value="reversal">Reversal Journal</option>
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

      {/* Journal Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Journal #</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-left font-medium">Reference</th>
                <th className="px-5 py-3 text-right font-medium">Total Amount</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {journals.length > 0 ? (
                journals.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-900 whitespace-nowrap">
                      <Link href={`/accounting/journals/${j.id}`} className="hover:underline text-blue-600">
                        {j.journal_number}
                      </Link>
                      {j.is_reversed && (
                        <span className="ml-2 inline-flex items-center text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-medium">
                          Reversed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{j.journal_date}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-700 whitespace-nowrap">
                      {j.journal_type.replace("_", " ")}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{j.description}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs font-mono">{j.reference || "—"}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                      {formatMoney(j.total_debit)}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(j.status)}>
                        {j.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link href={`/accounting/journals/${j.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                    {loading ? "Loading journal records..." : "No journal entries found matching criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

