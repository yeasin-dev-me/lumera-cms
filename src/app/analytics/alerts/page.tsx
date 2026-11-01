"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AlertRecord, AlertSeverity, AlertStatus } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sliders,
  Filter,
  Clock,
  User,
  Check,
  Eye,
  X,
} from "lucide-react";

export default function AlertsManagementPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [domainFilter, setDomainFilter] = useState<string>("");

  // Action Dialog state
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    alert: AlertRecord | null;
    actionType: "acknowledge" | "resolve" | "dismiss";
  }>({
    open: false,
    alert: null,
    actionType: "acknowledge",
  });
  const [actionNotes, setActionNotes] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAlertRecords({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        domain: domainFilter || undefined,
      });
      setAlerts(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load alerts.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, domainFilter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleOpenAction = (alert: AlertRecord, actionType: "acknowledge" | "resolve" | "dismiss") => {
    setActionNotes("");
    setActionError(null);
    setActionModal({ open: true, alert, actionType });
  };

  const handleCloseAction = () => {
    setActionModal({ open: false, alert: null, actionType: "acknowledge" });
    setActionNotes("");
    setActionError(null);
  };

  const handleSubmitAction = async () => {
    if (!actionModal.alert) return;
    try {
      setActionSubmitting(true);
      setActionError(null);
      if (actionModal.actionType === "acknowledge") {
        await adminApi.acknowledgeAlert(actionModal.alert.id, actionNotes);
      } else if (actionModal.actionType === "resolve") {
        await adminApi.resolveAlert(actionModal.alert.id, actionNotes);
      } else if (actionModal.actionType === "dismiss") {
        await adminApi.dismissAlert(actionModal.alert.id, actionNotes);
      }
      handleCloseAction();
      loadAlerts();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setActionError(err.message);
      } else {
        setActionError("Action failed. Please try again.");
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger">CRITICAL</Badge>;
      case "warning":
        return <Badge variant="warning">WARNING</Badge>;
      default:
        return <Badge variant="primary">INFO</Badge>;
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="danger">ACTIVE</Badge>;
      case "acknowledged":
        return <Badge variant="warning">ACKNOWLEDGED</Badge>;
      case "resolved":
        return <Badge variant="success">RESOLVED</Badge>;
      case "dismissed":
        return <Badge variant="muted">DISMISSED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/analytics"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Executive Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Actionable Business Alerts
          </h1>
          <p className="text-sm text-slate-500">
            Automated threshold surveillance and exception alerting across inventory, treasury, and receivables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/analytics/alerts/rules">
            <Button variant="secondary" className="flex items-center gap-1.5 text-xs">
              <Sliders className="h-3.5 w-3.5 text-indigo-600" />
              Configure Alert Rules
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Filters:
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs">
            {["all", "active", "acknowledged", "resolved", "dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === "all" ? "" : s)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                  (s === "all" && !statusFilter) || statusFilter === s
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs rounded border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
            <option value="info">Info Only</option>
          </select>

          {/* Domain Select */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="text-xs rounded border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Domains</option>
            <option value="inventory">Inventory</option>
            <option value="treasury">Treasury</option>
            <option value="receivables">Receivables</option>
            <option value="sales">Sales</option>
            <option value="procurement">Procurement</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadAlerts}
            disabled={loading}
            className="text-xs ml-auto"
          >
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <Alert variant="danger" title="Failed to Load Alerts">
          {error}
        </Alert>
      )}

      {/* Alerts List */}
      {loading ? (
        <Card className="p-12 text-center text-slate-400 bg-white">Loading alerts...</Card>
      ) : alerts.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No Alerts Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no alerts matching the selected filter criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 bg-white border transition-colors ${
                alert.severity === "critical" && alert.status === "active"
                  ? "border-rose-300 bg-rose-50/20"
                  : alert.severity === "warning" && alert.status === "active"
                  ? "border-amber-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                    <span className="text-xs font-mono font-medium text-slate-500 uppercase">
                      Domain: {alert.domain}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                  <p className="text-sm text-slate-700">{alert.message}</p>

                  {/* Metric Value vs Threshold */}
                  {(alert.metric_value !== null || alert.threshold_value !== null) && (
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded inline-flex mt-2">
                      {alert.metric_value && (
                        <span>
                          Observed Value: <span className="font-bold text-slate-900">{alert.metric_value}</span>
                        </span>
                      )}
                      {alert.threshold_value && (
                        <span>
                          Threshold Trigger: <span className="font-bold text-slate-900">{alert.threshold_value}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Lifecycle History Notes */}
                  {alert.acknowledged_by && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        Acknowledged by {alert.acknowledged_by.full_name || alert.acknowledged_by.email} at{" "}
                        {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString() : ""}
                        {alert.acknowledgement_notes && ` — "${alert.acknowledgement_notes}"`}
                      </span>
                    </div>
                  )}

                  {alert.resolved_by && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        Resolved by {alert.resolved_by.full_name || alert.resolved_by.email} at{" "}
                        {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : ""}
                        {alert.resolution_notes && ` — "${alert.resolution_notes}"`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {alert.status === "active" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenAction(alert, "acknowledge")}
                        className="text-xs flex items-center gap-1 text-amber-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Acknowledge
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenAction(alert, "resolve")}
                        className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAction(alert, "dismiss")}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                        Dismiss
                      </Button>
                    </>
                  )}

                  {alert.status === "acknowledged" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenAction(alert, "resolve")}
                        className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAction(alert, "dismiss")}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal (Acknowledge / Resolve / Dismiss) */}
      {actionModal.open && actionModal.alert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {actionModal.actionType} Alert
              </h3>
              <button
                onClick={handleCloseAction}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are updating alert <strong className="font-mono">{actionModal.alert.title}</strong> to{" "}
              <strong className="capitalize">{actionModal.actionType}d</strong>.
            </p>

            {actionError && (
              <Alert variant="danger" title="Error">
                {actionError}
              </Alert>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Audit Notes / Resolution Comments:
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                placeholder="Enter root cause, mitigation steps, or resolution remarks..."
                className="w-full text-xs rounded border border-slate-300 p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseAction}
                disabled={actionSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitAction}
                isLoading={actionSubmitting}
                className={
                  actionModal.actionType === "resolve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : actionModal.actionType === "dismiss"
                    ? "bg-slate-700 hover:bg-slate-800"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }
              >
                Confirm {actionModal.actionType}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

