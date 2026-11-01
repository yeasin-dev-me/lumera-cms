"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingEvent, EventStatus } from "@/types/events";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  Play,
  RotateCcw,
  Ban,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function EventQueuePage() {
  const [events, setEvents] = useState<AccountingEvent[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [operatingId, setOperatingId] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = { page, limit: 25 };
      if (statusFilter) params.status = statusFilter;
      if (moduleFilter) params.source_module = moduleFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await adminApi.getEventQueue(params);
      if (Array.isArray(res)) {
        setEvents(res);
        setTotalCount(res.length);
      } else {
        setEvents((res as any)?.results || []);
        setTotalCount((res as any)?.count || 0);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load outbox event queue.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, moduleFilter, searchTerm]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleRetry = async (eventId: number) => {
    try {
      setOperatingId(eventId);
      setActionSuccess(null);
      const res = await adminApi.retryEvent(eventId);
      setActionSuccess(`Event #${eventId} successfully retried: ${res.message}`);
      await loadQueue();
    } catch (err: any) {
      setError(err?.message || `Failed to retry event #${eventId}`);
    } finally {
      setOperatingId(null);
    }
  };

  const handleIgnore = async (eventId: number) => {
    const reason = prompt("Enter administrative cancellation / ignore reason:");
    if (!reason) return;

    try {
      setOperatingId(eventId);
      setActionSuccess(null);
      await adminApi.ignoreEvent(eventId, reason);
      setActionSuccess(`Event #${eventId} ignored.`);
      await loadQueue();
    } catch (err: any) {
      setError(err?.message || `Failed to ignore event #${eventId}`);
    } finally {
      setOperatingId(null);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case "posted":
        return <Badge variant="success">Posted to GL</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "processing":
        return <Badge variant="accent">Processing</Badge>;
      case "mapping_required":
        return <Badge variant="danger">Mapping Required</Badge>;
      case "retry_scheduled":
        return <Badge variant="warning">Retry Scheduled</Badge>;
      case "failed_permanent":
        return <Badge variant="danger">Failed Permanent</Badge>;
      case "dead_letter":
        return <Badge variant="danger">Dead Letter</Badge>;
      case "ignored":
        return <Badge variant="muted">Ignored</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Link href="/accounting" className="hover:text-neutral-900 transition-colors">
              Accounting
            </Link>
            <span>/</span>
            <Link href="/accounting/events" className="hover:text-neutral-900 transition-colors">
              Events
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Outbox Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Commercial Outbox Queue</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time audit log of asynchronous commercial integration events awaiting or posted to the General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadQueue} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4 border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search reference, event key, errors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="mapping_required">Mapping Required</option>
            <option value="processing">Processing (Leased)</option>
            <option value="retry_scheduled">Retry Scheduled</option>
            <option value="posted">Posted to GL</option>
            <option value="failed_permanent">Failed Permanent</option>
            <option value="dead_letter">Dead Letter</option>
            <option value="ignored">Ignored</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
          >
            <option value="">All Modules</option>
            <option value="sales">Sales</option>
            <option value="procurement">Procurement</option>
            <option value="inventory">Inventory</option>
            <option value="treasury">Treasury</option>
            <option value="expenses">Expenses</option>
          </select>

          {(statusFilter || moduleFilter || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("");
                setModuleFilter("");
                setSearchTerm("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Queue Table */}
      <Card className="overflow-hidden border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Event Key / Type</th>
                <th className="py-3 px-4">Source Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Retries</th>
                <th className="py-3 px-4">Journal Voucher</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Loading outbox queue...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No matching events found in queue.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{ev.event_type}</div>
                      <div className="text-xs font-mono text-neutral-400">{ev.event_key}</div>
                      {ev.last_error_message && (
                        <div className="text-xs text-rose-600 mt-1 max-w-md truncate" title={ev.last_error_message}>
                          Error: {ev.last_error_message}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-700">
                      <div>{ev.source_reference || ev.source_id}</div>
                      <div className="text-[11px] text-neutral-400 uppercase">{ev.source_module}.{ev.source_type}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      <div>{ev.accounting_date}</div>
                      <div className="text-xs text-neutral-400">{new Date(ev.occurred_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ev.status)}</td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {ev.attempt_count} / {ev.max_attempts}
                    </td>
                    <td className="py-3 px-4">
                      {ev.journal_number ? (
                        <Link
                          href={`/accounting/journals`}
                          className="font-mono text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1"
                        >
                          {ev.journal_number}
                          <ExternalLink className="h-3 w-3 text-neutral-400" />
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ev.status !== "posted" && ev.status !== "ignored" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={operatingId === ev.id}
                            onClick={() => handleRetry(ev.id)}
                            title="Retry event processing"
                            className="text-xs px-2"
                          >
                            <RotateCcw className={`h-3.5 w-3.5 mr-1 ${operatingId === ev.id ? "animate-spin" : ""}`} />
                            Retry
                          </Button>
                        )}
                        {ev.status !== "posted" && ev.status !== "ignored" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={operatingId === ev.id}
                            onClick={() => handleIgnore(ev.id)}
                            title="Ignore event"
                            className="text-xs text-neutral-500 hover:text-neutral-900 px-2"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Link href={`/accounting/events/${ev.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs px-2">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-500 bg-neutral-50">
          <div>
            Showing {events.length} of {totalCount} events
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span>Page {page}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={events.length < 25}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

