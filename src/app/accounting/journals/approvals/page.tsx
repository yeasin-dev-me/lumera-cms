"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { JournalEntry } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CheckSquare,
  XCircle,
  RefreshCw,
  Eye,
  ShieldAlert,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function JournalApprovalsPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Reject modal
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getJournals({
        status: "pending_approval",
        page_size: 50,
      });
      setJournals(res.results || (res as unknown as JournalEntry[]) || []);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load approval inbox.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleApprove = async (journal: JournalEntry) => {
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.approveJournal(journal.id);
      setActionMessage(`Journal ${journal.journal_number} approved successfully!`);
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve journal. Maker cannot approve their own submission.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedJournal) return;
    if (!rejectReason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.rejectJournal(selectedJournal.id, rejectReason.trim());
      setActionMessage(`Journal ${selectedJournal.journal_number} rejected.`);
      setSelectedJournal(null);
      setRejectReason("");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reject journal.");
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Journal Approval Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maker-checker authorization queue for double-entry journal vouchers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Governance Notice */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <p className="font-semibold">Separation of Duties (Maker-Checker Policy):</p>
          <p className="text-amber-800 mt-0.5">
            The creator/submitter of a journal entry cannot approve their own voucher. Approval must be executed by an
            independent authorized financial controller.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

      {/* Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Journal #</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Submitter</th>
                <th className="px-5 py-3 text-left font-medium">Description / Memo</th>
                <th className="px-5 py-3 text-right font-medium">Total (BDT)</th>
                <th className="px-5 py-3 text-right font-medium">Review & Actions</th>
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
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{j.journal_date}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-700 whitespace-nowrap">
                      {j.journal_type.replace("_", " ")}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium whitespace-nowrap">
                      {j.submitted_by_name || j.created_by_name || "Unknown"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{j.description}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {formatMoney(j.total_debit)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/accounting/journals/${j.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedJournal(j);
                            setRejectReason("");
                          }}
                          disabled={actionLoading}
                          className="text-xs text-rose-600 hover:text-rose-700"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(j)}
                          disabled={actionLoading}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    {loading ? "Checking approval queue..." : "No journal entries currently awaiting approval."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Reject Journal Voucher</h3>
            <p className="text-sm text-gray-500">
              Please enter the audit justification for rejecting {selectedJournal.journal_number}.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Account code mismatch or missing documentation..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelectedJournal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

