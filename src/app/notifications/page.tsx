"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AdminNotification, NotificationDeliveryStatus } from "@/types/notifications";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Can } from "@/lib/auth/permissions";
import {
  Mail,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Info,
} from "lucide-react";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [recipientQuery, setRecipientQuery] = useState<string>("");

  // Detail Modal / Inspector
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getNotifications({
        status: statusFilter || undefined,
        event_type: eventTypeFilter || undefined,
        recipient: recipientQuery.trim() || undefined,
      });
      setNotifications(res.results || []);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load notifications.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, eventTypeFilter, recipientQuery]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotifications();
  };

  const handleResend = async (publicId: string) => {
    setResendingId(publicId);
    setActionSuccess(null);
    setError(null);
    try {
      const updated = await adminApi.resendNotification(publicId);
      setActionSuccess(`Notification re-queued and dispatched successfully (Attempt #${updated.attempt_count}).`);
      // Update locally
      setNotifications((prev) =>
        prev.map((n) => (n.public_id === publicId ? updated : n))
      );
      if (selectedNotif?.public_id === publicId) {
        setSelectedNotif(updated);
      }
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to resend notification.");
      }
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadge = (status: NotificationDeliveryStatus) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Sent</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="muted" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <Can
      permission="notifications.read"
      fallback={<p className="text-xs text-rose-500">Access denied. notifications.read permission required.</p>}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-lumera-text">
                Customer Notifications
              </h1>
              <Badge variant="primary">Step 11 Active</Badge>
            </div>
            <p className="text-xs text-lumera-text-muted">
              Operational visibility into transactional delivery, email transport logs, deduplication, and manual dispatch recovery.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            isLoading={loading}
            onClick={fetchNotifications}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>

        {actionSuccess && (
          <Alert variant="success" title="Dispatch Succeeded">
            {actionSuccess}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" title="Operational Notice">
            {error}
          </Alert>
        )}

        {/* Filter Controls */}
        <Card className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs"
          >
            {/* Recipient Search */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-lumera-text-muted uppercase tracking-wider">
                Recipient Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by customer email..."
                  value={recipientQuery}
                  onChange={(e) => setRecipientQuery(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-3 py-1.5 pl-8 text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
                <Search className="h-3.5 w-3.5 text-lumera-text-muted absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-lumera-text-muted uppercase tracking-wider">
                Delivery Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent (Delivered)</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-lumera-text-muted uppercase tracking-wider">
                Event Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              >
                <option value="">All Event Types</option>
                <option value="account_welcome">Account Welcome</option>
                <option value="order_placed">Order Placed</option>
                <option value="payment_confirmed">Payment Confirmed</option>
                <option value="payment_failed">Payment Failed</option>
                <option value="order_processing">Order Processing</option>
                <option value="order_shipped">Order Shipped</option>
                <option value="order_delivered">Order Delivered</option>
                <option value="order_cancelled">Order Cancelled</option>
                <option value="return_requested">Return Requested</option>
                <option value="return_approved">Return Approved</option>
                <option value="return_rejected">Return Rejected</option>
                <option value="return_received">Return Received</option>
                <option value="refund_initiated">Refund Initiated</option>
                <option value="refund_completed">Refund Completed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="secondary" size="sm" className="w-full gap-1.5">
                <Filter className="h-3 w-3" />
                <span>Apply Filters</span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Notifications Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-lumera-text-muted font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Event & Subject</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-lumera-text-muted">
                      Loading notifications...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-lumera-text-muted">
                      No operational notifications found matching current filters.
                    </td>
                  </tr>
                ) : (
                  notifications.map((notif) => (
                    <tr
                      key={notif.public_id}
                      className="hover:bg-surface-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedNotif(notif)}
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-lumera-text truncate">
                          {notif.subject}
                        </div>
                        <div className="text-[10px] text-lumera-text-muted font-mono mt-0.5">
                          {notif.event_type}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-lumera-text">{notif.recipient}</div>
                        <div className="text-[10px] text-lumera-text-muted uppercase">
                          {notif.channel}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(notif.status)}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-lumera-text font-medium">
                          {notif.attempt_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-lumera-text-muted">
                        {notif.order_public_id && (
                          <span title={`Order ${notif.order_public_id}`}>
                            ORD-{notif.order_public_id.slice(0, 6)}
                          </span>
                        )}
                        {notif.return_public_id && (
                          <span title={`Return ${notif.return_public_id}`}>
                            RET-{notif.return_public_id.slice(0, 6)}
                          </span>
                        )}
                        {notif.refund_public_id && (
                          <span title={`Refund ${notif.refund_public_id}`}>
                            REF-{notif.refund_public_id.slice(0, 6)}
                          </span>
                        )}
                        {!notif.order_public_id &&
                          !notif.return_public_id &&
                          !notif.refund_public_id && (
                            <span className="text-lumera-text-muted/60">—</span>
                          )}
                      </td>
                      <td className="py-3 px-4 text-lumera-text-muted whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => setSelectedNotif(notif)}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                          <Can permission="notifications.manage">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 px-2 text-[11px] gap-1"
                              isLoading={resendingId === notif.public_id}
                              disabled={resendingId !== null}
                              onClick={() => handleResend(notif.public_id)}
                              title="Safely retry/resend notification"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Resend</span>
                            </Button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Modal / Flyout */}
        {selectedNotif && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-lg p-6 space-y-4 shadow-xl border border-border bg-surface">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-lumera-text">
                    Notification Details
                  </h3>
                  <p className="text-[11px] font-mono text-lumera-text-muted">
                    {selectedNotif.public_id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="text-lumera-text-muted hover:text-lumera-text text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Event Type
                  </dt>
                  <dd className="font-mono text-lumera-text font-medium mt-0.5">
                    {selectedNotif.event_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Delivery Status
                  </dt>
                  <dd className="mt-0.5">{getStatusBadge(selectedNotif.status)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Recipient
                  </dt>
                  <dd className="text-lumera-text font-medium mt-0.5">
                    {selectedNotif.recipient}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Channel
                  </dt>
                  <dd className="text-lumera-text uppercase font-mono mt-0.5">
                    {selectedNotif.channel}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Subject Line
                  </dt>
                  <dd className="text-lumera-text font-medium mt-0.5">
                    {selectedNotif.subject}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Attempt Count
                  </dt>
                  <dd className="font-mono text-lumera-text mt-0.5">
                    {selectedNotif.attempt_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Provider Message ID
                  </dt>
                  <dd className="font-mono text-[11px] text-lumera-text-muted mt-0.5">
                    {selectedNotif.provider_message_id || "None (pending/failed)"}
                  </dd>
                </div>
                {selectedNotif.error_message && (
                  <div className="col-span-2 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                    <div className="font-semibold text-rose-900 mb-1">
                      Transport Error Reason:
                    </div>
                    {selectedNotif.error_message}
                  </div>
                )}
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Created At
                  </dt>
                  <dd className="text-lumera-text-muted mt-0.5">
                    {new Date(selectedNotif.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-lumera-text-muted">
                    Dispatched / Failed At
                  </dt>
                  <dd className="text-lumera-text-muted mt-0.5">
                    {selectedNotif.sent_at
                      ? new Date(selectedNotif.sent_at).toLocaleString()
                      : selectedNotif.failed_at
                      ? new Date(selectedNotif.failed_at).toLocaleString()
                      : "Pending"}
                  </dd>
                </div>
              </dl>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Can permission="notifications.manage">
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                    isLoading={resendingId === selectedNotif.public_id}
                    onClick={() => handleResend(selectedNotif.public_id)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Resend Notification</span>
                  </Button>
                </Can>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedNotif(null)}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Can>
  );
}
