"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingEvent, EventQueueStats } from "@/types/events";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Activity,
  Network,
  Scale,
  Building2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

export default function EventsDashboardPage() {
  const [stats, setStats] = useState<EventQueueStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<AccountingEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, eventsRes] = await Promise.all([
        adminApi.getEventStats(),
        adminApi.getEventQueue({ limit: 10 }),
      ]);
      setStats(statsData);
      const eventsList = Array.isArray(eventsRes) ? eventsRes : (eventsRes as any)?.results || [];
      setRecentEvents(eventsList);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load events dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTriggerBatch = async () => {
    try {
      setBatchProcessing(true);
      setBatchResult(null);
      const res = await adminApi.triggerBatchProcess({ batch_size: 50 });
      setBatchResult(
        `Batch completed: ${res.claimed || 0} claimed, ${res.succeeded || 0} succeeded, ${res.failed || 0} failed, ${res.dead_letter || 0} dead-letter.`
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to trigger batch processing.");
    } finally {
      setBatchProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge variant="success">Posted to GL</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "processing":
        return <Badge variant="accent">Processing (Leased)</Badge>;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Link href="/accounting" className="hover:text-neutral-900 transition-colors">
              Accounting
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Event Integration & Outbox</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Commercial Event Outbox & GL Synchronization</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Transactional outbox processing, versioned ledger mappings, and financial subledger reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleTriggerBatch}
            disabled={batchProcessing}
            className="flex items-center gap-2"
          >
            <Play className={`h-4 w-4 ${batchProcessing ? "animate-spin" : ""}`} />
            {batchProcessing ? "Processing..." : "Run Outbox Worker"}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {batchResult && <Alert variant="success">{batchResult}</Alert>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white border border-neutral-200">
          <div className="text-xs font-medium text-neutral-500">Total Events</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{stats?.total || 0}</div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="text-xs font-medium text-emerald-600">Posted to GL</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.posted || 0}</div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="text-xs font-medium text-amber-600">Pending Outbox</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats?.pending || 0}</div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="text-xs font-medium text-rose-600">Mapping Required</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats?.mapping_required || 0}</div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="text-xs font-medium text-orange-600">Retry Scheduled</div>
          <div className="text-2xl font-bold text-orange-700 mt-1">{stats?.retry_scheduled || 0}</div>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <div className="text-xs font-medium text-red-700">Dead Letter / Failed</div>
          <div className="text-2xl font-bold text-red-800 mt-1">
            {(stats?.failed_permanent || 0) + (stats?.dead_letter || 0)}
          </div>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/accounting/events/queue">
          <Card className="p-5 hover:border-neutral-400 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-neutral-900 font-semibold mb-2">
                <Activity className="h-5 w-5 text-neutral-700" />
                <span>Outbox Queue</span>
              </div>
              <p className="text-sm text-neutral-500">
                Inspect unprocessed commercial events, transient errors, and trigger manual retries.
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-neutral-900">
              View Queue <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link href="/accounting/event-mappings">
          <Card className="p-5 hover:border-neutral-400 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-neutral-900 font-semibold mb-2">
                <Network className="h-5 w-5 text-neutral-700" />
                <span>Event Mappings</span>
              </div>
              <p className="text-sm text-neutral-500">
                Configure versioned transformation rules and maker-checker accounting definitions.
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-neutral-900">
              Manage Mappings <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link href="/accounting/treasury-mappings">
          <Card className="p-5 hover:border-neutral-400 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-neutral-900 font-semibold mb-2">
                <Building2 className="h-5 w-5 text-neutral-700" />
                <span>Treasury Mappings</span>
              </div>
              <p className="text-sm text-neutral-500">
                Map operational bank, cash drawer, and clearing accounts to Chart of Accounts nodes.
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-neutral-900">
              Configure Treasury <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>

        <Link href="/accounting/reconciliation">
          <Card className="p-5 hover:border-neutral-400 transition-colors cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-neutral-900 font-semibold mb-2">
                <Scale className="h-5 w-5 text-neutral-700" />
                <span>GL Reconciliation</span>
              </div>
              <p className="text-sm text-neutral-500">
                Authoritative multi-subledger reconciliation: AR, AP, Treasury, and Inventory vs GL.
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-neutral-900">
              View Reconciliation <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Events Stream */}
      <Card className="overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Recent Commercial Events</h2>
            <p className="text-xs text-neutral-500">Latest outbox activity across operational domains</p>
          </div>
          <Link href="/accounting/events/queue">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Events
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source Ref</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Accounting Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Journal Voucher</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {loading && recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Loading outbox stream...
                  </td>
                </tr>
              ) : recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No commercial events recorded yet.
                  </td>
                </tr>
              ) : (
                recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      <div>{ev.event_type}</div>
                      <div className="text-xs text-neutral-400 font-mono">{ev.event_key}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-700">
                      {ev.source_reference || ev.source_id}
                    </td>
                    <td className="py-3 px-4 capitalize text-neutral-600">{ev.source_module}</td>
                    <td className="py-3 px-4 text-neutral-600">{ev.accounting_date}</td>
                    <td className="py-3 px-4">{getStatusBadge(ev.status)}</td>
                    <td className="py-3 px-4">
                      {ev.journal_number ? (
                        <Link
                          href={`/accounting/journals`}
                          className="font-mono text-xs text-neutral-900 font-semibold hover:underline"
                        >
                          {ev.journal_number}
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/accounting/events/${ev.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

