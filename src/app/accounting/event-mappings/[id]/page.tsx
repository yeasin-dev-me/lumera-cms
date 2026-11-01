"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  AccountingEventMapping,
  AccountingEventMappingVersion,
  DryRunPreviewResult,
  MappingStatus,
} from "@/types/events";
import { Account } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  PlusCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  StopCircle,
  Layers,
} from "lucide-react";

export default function MappingDetailPage() {
  const params = useParams();
  const mappingId = params.id as string;

  const [mapping, setMapping] = useState<AccountingEventMapping | null>(null);
  const [versions, setVersions] = useState<AccountingEventMappingVersion[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // New Version Form state
  const [showNewVersion, setShowNewVersion] = useState<boolean>(false);
  const [debitAccountId, setDebitAccountId] = useState<string>("");
  const [creditAccountId, setCreditAccountId] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>("");
  const [effectiveTo, setEffectiveTo] = useState<string>("");

  // Dry Run Preview State
  const [previewPayload, setPreviewPayload] = useState<string>(
    JSON.stringify({ grand_total: "1500.00", subtotal: "1500.00" }, null, 2)
  );
  const [previewResult, setPreviewResult] = useState<DryRunPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mappingData, versionsData, accsRes] = await Promise.all([
        adminApi.getEventMapping(mappingId),
        adminApi.getEventMappingVersions(mappingId),
        adminApi.getAccounts({ is_group: false }),
      ]);
      setMapping(mappingData);
      setVersions(versionsData);
      const accList = Array.isArray(accsRes) ? accsRes : (accsRes as any)?.results || [];
      setAccounts(accList);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load mapping details.");
      }
    } finally {
      setLoading(false);
    }
  }, [mappingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await adminApi.createEventMappingVersion(mappingId, {
        debit_account_id: debitAccountId ? Number(debitAccountId) : null,
        credit_account_id: creditAccountId ? Number(creditAccountId) : null,
        effective_from: effectiveFrom || null,
        effective_to: effectiveTo || null,
      });
      setShowNewVersion(false);
      setActionSuccess("Created new draft version.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to create version.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitVersion = async (versionId: number) => {
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await adminApi.submitEventMappingVersion(versionId);
      setActionSuccess("Version submitted for approval.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to submit version.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveVersion = async (versionId: number) => {
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await adminApi.approveEventMappingVersion(versionId);
      setActionSuccess("Version approved (maker-checker verified).");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to approve version.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateVersion = async (versionId: number) => {
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await adminApi.activateEventMappingVersion(versionId);
      setActionSuccess("Version activated as authoritative current definition.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to activate version.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetireVersion = async (versionId: number) => {
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await adminApi.retireEventMappingVersion(versionId);
      setActionSuccess("Version retired.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to retire version.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunPreview = async () => {
    if (!mapping) return;
    try {
      setPreviewLoading(true);
      setError(null);
      let parsed = {};
      try {
        parsed = JSON.parse(previewPayload);
      } catch {
        setError("Invalid JSON format in test payload.");
        return;
      }

      const res = await adminApi.previewEventMapping({
        event_type: mapping.event_type,
        payload: parsed,
      });
      setPreviewResult(res);
    } catch (err: any) {
      setError(err?.message || "Preview calculation failed.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const getVersionBadge = (status: MappingStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "approved":
        return <Badge variant="accent">Approved</Badge>;
      case "pending_approval":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "draft":
        return <Badge variant="muted">Draft</Badge>;
      case "retired":
        return <Badge variant="muted">Retired</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  if (loading && !mapping) {
    return <div className="p-8 text-center text-neutral-500">Loading mapping definition...</div>;
  }

  if (!mapping) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto">
        <Alert variant="danger">Mapping #{mappingId} not found.</Alert>
        <Link href="/accounting/event-mappings">
          <Button variant="secondary">Back to Mappings</Button>
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
            <Link href="/accounting/event-mappings" className="hover:text-neutral-900 transition-colors">
              Event Mappings
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-mono font-medium">{mapping.event_type}</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{mapping.name}</h1>
          <p className="text-xs font-mono text-neutral-500 mt-1">{mapping.event_type}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/accounting/event-mappings">
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Directory
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewVersion(!showNewVersion)}
            className="flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            {showNewVersion ? "Close Form" : "Draft New Version"}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {/* New Version Creation Form */}
      {showNewVersion && (
        <Card className="p-6 border border-neutral-300 bg-white">
          <h2 className="text-base font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-100">
            Create Draft Version
          </h2>
          <form onSubmit={handleCreateVersion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Debit Account (DR)</label>
                <select
                  value={debitAccountId}
                  onChange={(e) => setDebitAccountId(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="">-- Dynamic / From Subledger --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Credit Account (CR)</label>
                <select
                  value={creditAccountId}
                  onChange={(e) => setCreditAccountId(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="">-- Dynamic / From Subledger --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Effective From Date</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Effective To Date</label>
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowNewVersion(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Save Draft Version"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Versions List */}
      <Card className="overflow-hidden border border-neutral-200">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Historical Mapping Versions</h2>
          <p className="text-xs text-neutral-500">Immutable versions governed by maker-checker verification</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Debit Account</th>
                <th className="py-3 px-4">Credit Account</th>
                <th className="py-3 px-4">Effective Dates</th>
                <th className="py-3 px-4">Audit (Maker / Checker)</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No versions found.
                  </td>
                </tr>
              ) : (
                versions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">v{ver.version_number}</td>
                    <td className="py-3 px-4">{getVersionBadge(ver.status)}</td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {ver.debit_account_code ? `[${ver.debit_account_code}] ${ver.debit_account_name}` : "Dynamic"}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {ver.credit_account_code ? `[${ver.credit_account_code}] ${ver.credit_account_name}` : "Dynamic"}
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-600">
                      {ver.effective_from || "Always"} → {ver.effective_to || "Indefinite"}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div>Maker: {ver.created_by_email || "System"}</div>
                      {ver.approved_by_email && <div className="text-emerald-700">Checker: {ver.approved_by_email}</div>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ver.status === "draft" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleSubmitVersion(ver.id)}
                            className="text-xs"
                          >
                            <Send className="h-3 w-3 mr-1" /> Submit
                          </Button>
                        )}
                        {ver.status === "pending_approval" && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleApproveVersion(ver.id)}
                            className="text-xs"
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        {ver.status === "approved" && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleActivateVersion(ver.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Activate
                          </Button>
                        )}
                        {ver.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleRetireVersion(ver.id)}
                            className="text-xs text-neutral-500 hover:text-red-700"
                          >
                            <StopCircle className="h-3 w-3 mr-1" /> Retire
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dry Run Simulator */}
      <Card className="p-6 border border-neutral-200 bg-white space-y-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Dry-Run Preview Simulator</h2>
          <p className="text-xs text-neutral-500">
            Simulate double-entry balancing lines without persisting transactions or updating GL balances.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Sample Event JSON Payload
            </label>
            <textarea
              rows={8}
              value={previewPayload}
              onChange={(e) => setPreviewPayload(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunPreview}
              disabled={previewLoading}
              className="mt-2 flex items-center gap-1.5 text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              {previewLoading ? "Simulating..." : "Calculate Accounting Lines"}
            </Button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Proposed Double-Entry Journal Lines
            </label>
            {!previewResult ? (
              <div className="h-[200px] border border-dashed border-neutral-300 rounded-md flex items-center justify-center text-xs text-neutral-400">
                Click &quot;Calculate Accounting Lines&quot; to preview ledger impact
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-neutral-100 rounded text-xs space-y-1">
                  <div className="flex justify-between font-mono">
                    <span>Total Debits: ৳{previewResult.total_debit}</span>
                    <span>Total Credits: ৳{previewResult.total_credit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-neutral-200">
                    <span className="font-semibold">Mathematical Equilibrium:</span>
                    {previewResult.is_balanced ? (
                      <Badge variant="success">Balanced (DR == CR)</Badge>
                    ) : (
                      <Badge variant="danger">Unbalanced (Diff: ৳{previewResult.difference})</Badge>
                    )}
                  </div>
                </div>

                <div className="border border-neutral-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 font-medium">
                      <tr>
                        <th className="p-2">Account</th>
                        <th className="p-2 text-right">Debit (৳)</th>
                        <th className="p-2 text-right">Credit (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-mono">
                      {previewResult.lines.map((l, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            [{l.account_code}] {l.account_name}
                          </td>
                          <td className="p-2 text-right">{l.debit !== "0.00" ? l.debit : "-"}</td>
                          <td className="p-2 text-right">{l.credit !== "0.00" ? l.credit : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
