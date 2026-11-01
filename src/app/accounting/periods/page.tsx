"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingPeriodInfo, PeriodReadinessReport } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CalendarClock,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Eye,
} from "lucide-react";

export default function AccountingPeriodsPage() {
  const [periods, setPeriods] = useState<AccountingPeriodInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Lock / Reopen Modal
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriodInfo | null>(null);
  const [modalMode, setModalMode] = useState<"lock" | "reopen" | "readiness" | null>(null);
  const [reasonInput, setReasonInput] = useState<string>("");
  const [readinessData, setReadinessData] = useState<PeriodReadinessReport | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getLedgerPeriods();
      const list = Array.isArray(res) ? res : (res as any)?.results || [];
      setPeriods(list);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load accounting periods.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReadinessModal = async (period: AccountingPeriodInfo) => {
    setSelectedPeriod(period);
    setModalMode("readiness");
    try {
      setActionLoading(true);
      const data = await adminApi.getPeriodReadiness(period.id);
      setReadinessData(data);
    } catch (err) {
      alert("Failed to evaluate period readiness.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockConfirm = async () => {
    if (!selectedPeriod) return;
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.lockAccountingPeriod(selectedPeriod.id, reasonInput.trim());
      setActionMessage(`Period "${selectedPeriod.name}" is now locked. Journal posting blocked.`);
      setModalMode(null);
      setSelectedPeriod(null);
      setReasonInput("");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to lock period.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenConfirm = async () => {
    if (!selectedPeriod) return;
    if (!reasonInput.trim()) {
      alert("A mandatory audit reason is required to reopen a closed period.");
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.reopenAccountingPeriod(selectedPeriod.id, reasonInput.trim());
      setActionMessage(`Period "${selectedPeriod.name}" has been reopened for adjustments.`);
      setModalMode(null);
      setSelectedPeriod(null);
      setReasonInput("");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reopen period.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Accounting Periods Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Period locking, retroactive posting protection, and readiness audit for financial closing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

      {/* Governance Card */}
      <Card className="p-4 bg-blue-50/50 border-blue-200 text-xs text-blue-900 space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Period Integrity Rules:
        </p>
        <p className="text-blue-800">
          • Journal vouchers can ONLY be posted into an OPEN period whose date range covers the voucher date.
        </p>
        <p className="text-blue-800">
          • Locking a period freezes all journals. Reopening requires a recorded audit reason.
        </p>
      </Card>

      {/* Periods Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Fiscal Year</th>
                <th className="px-5 py-3 text-left font-medium">Period Name</th>
                <th className="px-5 py-3 text-left font-medium">Start Date</th>
                <th className="px-5 py-3 text-left font-medium">End Date</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Audit Notes</th>
                <th className="px-5 py-3 text-right font-medium">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {periods.length > 0 ? (
                periods.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{p.fiscal_year_name}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{p.start_date}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{p.end_date}</td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {p.is_closed ? (
                        <Badge variant="danger">Locked / Closed</Badge>
                      ) : (
                        <Badge variant="success">Open</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                      {p.reopen_reason ? (
                        <span className="text-amber-700">Reopened: {p.reopen_reason}</span>
                      ) : p.lock_reason ? (
                        <span>Locked: {p.lock_reason}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReadinessModal(p)}
                          className="text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Readiness
                        </Button>

                        {p.is_closed ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedPeriod(p);
                              setModalMode("reopen");
                              setReasonInput("");
                            }}
                            className="text-xs text-amber-600 hover:text-amber-700 gap-1"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            Reopen
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedPeriod(p);
                              setModalMode("lock");
                              setReasonInput("");
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 gap-1"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Lock Period
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    {loading ? "Loading periods..." : "No accounting periods defined."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lock Modal */}
      {modalMode === "lock" && selectedPeriod && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Lock className="h-5 w-5" />
              <h3 className="text-lg font-bold text-gray-900">Lock Accounting Period</h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to lock <strong>{selectedPeriod.name}</strong>? No new journal vouchers can be
              posted into this period while locked.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lock Reason (Optional)</label>
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Month-end closing completed"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModalMode(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLockConfirm}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Lock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {modalMode === "reopen" && selectedPeriod && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Unlock className="h-5 w-5" />
              <h3 className="text-lg font-bold text-gray-900">Reopen Accounting Period</h3>
            </div>
            <p className="text-sm text-gray-600">
              Reopening <strong>{selectedPeriod.name}</strong> will permit retroactive journal postings. A mandatory audit
              reason must be recorded.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mandatory Reopen Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                rows={3}
                placeholder="Audit explanation for reopening this closed financial period..."
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModalMode(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReopenConfirm}
                disabled={actionLoading || !reasonInput.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Confirm Reopen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Period Readiness Report Modal */}
      {modalMode === "readiness" && selectedPeriod && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Period Closing Readiness</h3>
                <p className="text-xs text-gray-500">{selectedPeriod.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setModalMode(null)}>
                ✕
              </Button>
            </div>

            {readinessData ? (
              <div className="space-y-4 text-sm">
                <div
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    readinessData.is_ready_to_close
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  {readinessData.is_ready_to_close ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <p className="font-semibold text-xs">
                    {readinessData.is_ready_to_close
                      ? "Ready for Closing: No pending or draft journal entries block this period."
                      : "Action Required: Outstanding draft or unapproved journals exist in this period."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Draft Journals</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{readinessData.draft_journals_count}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Pending Approvals</p>
                    <p className="text-lg font-bold text-amber-600 mt-0.5">{readinessData.pending_approval_count}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Approved (Unposted)</p>
                    <p className="text-lg font-bold text-blue-600 mt-0.5">{readinessData.approved_unposted_count}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Posted Journals</p>
                    <p className="text-lg font-bold text-emerald-600 mt-0.5">{readinessData.posted_journals_count}</p>
                  </div>
                </div>

                {readinessData.warnings.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-700">Pre-close Warnings:</p>
                    <ul className="list-disc pl-5 text-xs text-rose-600 space-y-0.5">
                      {readinessData.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">Evaluating period status...</div>
            )}

            <div className="flex items-center justify-end pt-2">
              <Button variant="secondary" onClick={() => setModalMode(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
