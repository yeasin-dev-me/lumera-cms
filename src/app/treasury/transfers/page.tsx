"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { FinancialAccount, FundTransfer } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeftRight,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function FundTransfersPage() {
  const [transfers, setTransfers] = useState<FundTransfer[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initiate Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    from_account: 0,
    to_account: 0,
    amount: "",
    transfer_date: new Date().toISOString().split("T")[0],
    reference: "",
    external_reference: "",
  });

  // Action Confirmation / Reason Modal
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "complete" | "reject" | "reverse";
    transfer: FundTransfer;
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [trfRes, accRes] = await Promise.all([
        adminApi.getFundTransfers(),
        adminApi.getFinancialAccounts({ is_active: true }),
      ]);
      setTransfers(trfRes);
      setAccounts(accRes);
      if (accRes.length >= 2 && formData.from_account === 0) {
        setFormData((prev) => ({
          ...prev,
          from_account: accRes[0].id,
          to_account: accRes[1].id,
        }));
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load fund transfers.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from_account === formData.to_account) {
      setError("Source and destination accounts must be strictly different.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await adminApi.initiateFundTransfer(formData);
      setSuccessMsg("Fund transfer initiated and queued for maker-checker approval.");
      setShowModal(false);
      setFormData((prev) => ({ ...prev, amount: "", reference: "", external_reference: "" }));
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to initiate transfer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    try {
      setActionSubmitting(true);
      setError(null);
      const { type, transfer } = actionModal;

      if (type === "approve") {
        await adminApi.approveFundTransfer(transfer.id);
        setSuccessMsg(`Transfer ${transfer.transfer_number} approved successfully.`);
      } else if (type === "complete") {
        await adminApi.completeFundTransfer(transfer.id);
        setSuccessMsg(`Transfer ${transfer.transfer_number} executed. Balances updated.`);
      } else if (type === "reject") {
        await adminApi.rejectFundTransfer(transfer.id, actionReason);
        setSuccessMsg(`Transfer ${transfer.transfer_number} rejected.`);
      } else if (type === "reverse") {
        await adminApi.reverseFundTransfer(transfer.id, actionReason);
        setSuccessMsg(`Transfer ${transfer.transfer_number} reversed. Compensating movements posted.`);
      }

      setActionModal(null);
      setActionReason("");
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to execute transfer action.");
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "approved":
        return <Badge variant="primary">Approved (Ready)</Badge>;
      case "pending_approval":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "reversed":
        return <Badge variant="muted">Reversed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Internal Fund Transfers
          </h1>
          <p className="text-sm text-neutral-500">
            Inter-account liquidity rebalancing with strict Maker-Checker supervisory governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Initiate Transfer
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {/* Transfers List Table */}
      <Card className="bg-white border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            Transfer Ledger ({transfers.length} records)
          </h2>
          <p className="text-xs text-neutral-500">
            Approved transfers create dual atomic operational transactions (Source Outflow + Destination Inflow).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Transfer #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">From Account</th>
                <th className="px-4 py-3">To Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Governance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length > 0 ? (
                transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                      {trf.transfer_number}
                      {trf.reference && (
                        <span className="block text-xs font-normal text-neutral-500 truncate max-w-xs">
                          {trf.reference}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 font-mono whitespace-nowrap">
                      {trf.transfer_date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neutral-900 text-xs block">
                        {trf.from_account_code}
                      </span>
                      <span className="text-[11px] text-neutral-500">{trf.from_account_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neutral-900 text-xs block">
                        {trf.to_account_code}
                      </span>
                      <span className="text-[11px] text-neutral-500">{trf.to_account_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">
                      {formatMoney(trf.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      <div>Maker: <span className="font-medium text-neutral-800">{trf.initiated_by_username}</span></div>
                      {trf.approved_by_username && (
                        <div>Checker: <span className="font-medium text-neutral-800">{trf.approved_by_username}</span></div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(trf.status)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {trf.status === "pending_approval" && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setActionModal({ type: "approve", transfer: trf })}
                            className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActionModal({ type: "reject", transfer: trf })}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {trf.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => setActionModal({ type: "complete", transfer: trf })}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Complete Transfer
                        </Button>
                      )}

                      {trf.status === "completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActionModal({ type: "reverse", transfer: trf })}
                          className="h-7 text-xs text-neutral-500 hover:text-rose-600 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Reverse
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500">
                    No internal fund transfers recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Initiate Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Initiate Fund Transfer</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInitiate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Source Account (Outflow) *</label>
                <select
                  required
                  value={formData.from_account}
                  onChange={(e) => setFormData({ ...formData, from_account: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name} ({formatMoney(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Destination Account (Inflow) *</label>
                <select
                  required
                  value={formData.to_account}
                  onChange={(e) => setFormData({ ...formData, to_account: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name} ({formatMoney(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Transfer Amount (BDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.transfer_date}
                    onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Business Purpose / Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily outlet cash replenishment, Bank deposit"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">External Bank Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="Optional bank cheque or wire reference..."
                  value={formData.external_reference}
                  onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    "Initiate Transfer"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Dialog (Approve, Complete, Reject, Reverse) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 capitalize">
              {actionModal.type} Transfer #{actionModal.transfer.transfer_number}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Amount: <span className="font-bold text-neutral-900 font-mono">{formatMoney(actionModal.transfer.amount)}</span> from{" "}
              <span className="font-bold">{actionModal.transfer.from_account_code}</span> to{" "}
              <span className="font-bold">{actionModal.transfer.to_account_code}</span>.
            </p>

            {(actionModal.type === "reject" || actionModal.type === "reverse") && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-neutral-700">Audit Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder={`Reason for ${actionModal.type}...`}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActionModal(null);
                  setActionReason("");
                }}
                disabled={actionSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteAction}
                disabled={
                  actionSubmitting ||
                  ((actionModal.type === "reject" || actionModal.type === "reverse") &&
                    !actionReason.trim())
                }
                className={
                  actionModal.type === "reject" || actionModal.type === "reverse"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }
              >
                {actionSubmitting ? "Processing..." : `Confirm ${actionModal.type}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
