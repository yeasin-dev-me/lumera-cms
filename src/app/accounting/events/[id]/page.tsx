"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingEvent, EventStatus } from "@/types/events";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Activity,
  ArrowLeft,
  RotateCcw,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Code,
  History as HistoryIcon,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<AccountingEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getEvent(eventId);
      setEvent(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load event details.");
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleRetry = async () => {
    if (!event) return;
    try {
      setActionLoading(true);
      setActionSuccess(null);
      const res = await adminApi.retryEvent(event.id);
      setActionSuccess(`Event retried: ${res.message}`);
      await loadEvent();
    } catch (err: any) {
      setError(err?.message || "Failed to retry event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIgnore = async () => {
    if (!event) return;
    const reason = prompt("Enter administrative cancellation / ignore reason:");
    if (!reason) return;

    try {
      setActionLoading(true);
      setActionSuccess(null);
      await adminApi.ignoreEvent(event.id, reason);
      setActionSuccess("Event marked ignored.");
      await loadEvent();
    } catch (err: any) {
      setError(err?.message || "Failed to ignore event.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
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

  if (loading && !event) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Loading commercial event #{eventId}...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto">
        <Alert variant="danger">Event #{eventId} not found.</Alert>
        <Link href="/accounting/events/queue">
          <Button variant="secondary">Back to Queue</Button>
        </Link>
      </div>
    );
  }

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
            <Link href="/accounting/events/queue" className="hover:text-neutral-900 transition-colors">
              Outbox Queue
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-mono font-medium">#{event.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">{event.event_type}</h1>
            {getStatusBadge(event.status)}
          </div>
          <p className="text-xs font-mono text-neutral-500 mt-1">{event.event_key}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/accounting/events/queue">
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Queue
            </Button>
          </Link>

          {event.status !== "posted" && event.status !== "ignored" && (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={handleRetry}
                className="flex items-center gap-1.5"
              >
                <RotateCcw className={`h-4 w-4 ${actionLoading ? "animate-spin" : ""}`} />
                Retry Processing
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={actionLoading}
                onClick={handleIgnore}
                className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900"
              >
                <Ban className="h-4 w-4" /> Ignore
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Payload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <Card className="p-5 border border-neutral-200 bg-white">
            <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-100">
              Envelope & Source Execution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutral-500 block">Source Module</span>
                <span className="font-medium text-neutral-900 capitalize">{event.source_module}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Source Type</span>
                <span className="font-mono text-xs text-neutral-900">{event.source_type}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Source Reference</span>
                <span className="font-mono text-xs text-neutral-900 font-semibold">
                  {event.source_reference || event.source_id}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-500 block">Accounting Date</span>
                <span className="text-neutral-900">{event.accounting_date}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Currency</span>
                <span className="font-semibold text-neutral-900">{event.currency}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Occurred Timestamp</span>
                <span className="text-neutral-900 text-xs">{new Date(event.occurred_at).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-xs text-neutral-500 block">Retry Attempts</span>
                <span className="text-neutral-900 font-mono">
                  {event.attempt_count} / {event.max_attempts}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Next Retry</span>
                <span className="text-neutral-900 text-xs">
                  {event.next_retry_at ? new Date(event.next_retry_at).toLocaleString() : "None"}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Processed Timestamp</span>
                <span className="text-neutral-900 text-xs">
                  {event.processed_at ? new Date(event.processed_at).toLocaleString() : "Unprocessed"}
                </span>
              </div>
            </div>

            {/* Error Message Alert */}
            {event.last_error_message && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800">
                <div className="font-bold mb-0.5">Processing Error [{event.last_error_code || "ERROR"}]</div>
                <div className="font-mono">{event.last_error_message}</div>
              </div>
            )}

            {/* Linked Journal Card */}
            {event.accounting_journal_id && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md flex justify-between items-center">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase">Synchronized Journal Entry</div>
                  <div className="font-mono text-sm font-bold text-emerald-950 mt-0.5">
                    {event.journal_number || `Journal #${event.accounting_journal_id}`}
                  </div>
                </div>
                <Link href={`/accounting/journals`}>
                  <Button variant="secondary" size="sm" className="bg-white text-xs">
                    View in GL <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Payload Inspector */}
          <Card className="p-5 border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
              <Code className="h-4 w-4 text-neutral-600" />
              <h2 className="text-base font-semibold text-neutral-900">Event Payload Snapshot</h2>
            </div>
            <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-md text-xs font-mono overflow-x-auto max-h-[400px]">
              {JSON.stringify(event.payload || {}, null, 2)}
            </pre>
          </Card>
        </div>

        {/* Right Column: Audit Trail History */}
        <div className="space-y-6">
          <Card className="p-5 border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
              <HistoryIcon className="h-4 w-4 text-neutral-600" />
              <h2 className="text-base font-semibold text-neutral-900">State Transition Trail</h2>
            </div>

            {(!event.history || event.history.length === 0) ? (
              <div className="text-xs text-neutral-400 text-center py-6">No historical transitions recorded.</div>
            ) : (
              <div className="relative border-l-2 border-neutral-200 ml-3 space-y-6 py-2">
                {event.history.map((h) => (
                  <div key={h.id} className="relative pl-6">
                    {/* Circle marker */}
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-neutral-900" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 capitalize">{h.action}</span>
                        <Badge variant="muted" className="text-[10px] py-0 px-1.5">
                          {h.to_status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {new Date(h.created_at).toLocaleString()} by {h.actor_email || h.actor_type}
                      </div>
                      {h.notes && (
                        <div className="text-xs text-neutral-600 mt-1.5 p-2 bg-neutral-50 rounded border border-neutral-200 font-mono">
                          {h.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

