"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { OwnerDrawing } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  TrendingDown,
  CheckCircle2,
  RotateCcw,
  Clock,
  Landmark,
  CreditCard,
  X,
} from "lucide-react";

export default function OwnerDrawingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [drawing, setDrawing] = useState<OwnerDrawing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getOwnerDrawing(id);
      setDrawing(data);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load drawing details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async () => {
    if (!drawing) return;
    try {
      setError(null);
      await adminApi.submitOwnerDrawing(drawing.id);
      setSuccessMsg("Drawing submitted for approval.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Submission failed.");
    }
  };

  const handleApprove = async () => {
    if (!drawing) return;
    if (!confirm(`Are you sure you want to approve drawing of ${formatMoney(drawing.amount)} for ${drawing.recipient_name}?`)) {
      return;
    }
    try {
      setError(null);
      await adminApi.approveOwnerDrawing(drawing.id);
      setSuccessMsg("Drawing approved.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Approval failed.");
    }
  };

  const handleDisburse = async () => {
    if (!drawing) return;
    if (!confirm(`Disburse ${formatMoney(drawing.amount)} from ${drawing.financial_account_name}? This will book a Treasury outflow.`)) {
      return;
    }
    try {
      setError(null);
      await adminApi.disburseOwnerDrawing(drawing.id);
      setSuccessMsg("Drawing disbursed via Treasury.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Disbursement failed.");
    }
  };

  const handleReverse = async () => {
    if (!drawing) return;
    const reason = prompt("Enter reason for reversing this owner drawing:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.reverseOwnerDrawing(drawing.id, reason);
      setSuccessMsg("Drawing reversed. Funds restored to Treasury.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Reversal failed.");
    }
  };

  const handleCancel = async () => {
    if (!drawing) return;
    const reason = prompt("Enter reason for cancellation:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.cancelOwnerDrawing(drawing.id, reason);
      setSuccessMsg("Drawing cancelled.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Cancellation failed.");
    }
  };

  if (loading && !drawing) {
    return <div className="p-8 text-center text-gray-500">Loading drawing details...</div>;
  }

  if (!drawing) {
    return (
      <div className="p-8 text-center text-red-500">
        Drawing not found. <Link href="/finance/owner-drawings" className="underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/finance/owner-drawings" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> All Drawings
            </Link>
            <span>/</span>
            <span className="font-mono">{drawing.drawing_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{drawing.drawing_number}</h1>
            <Badge
              variant={
                drawing.status === "disbursed"
                  ? "success"
                  : drawing.status === "approved"
                  ? "primary"
                  : drawing.status === "pending_approval"
                  ? "warning"
                  : "muted"
              }
            >
              {drawing.status_display}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {drawing.status === "draft" && (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Submit for Approval
              </Button>
            </>
          )}

          {drawing.status === "pending_approval" && (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Reject / Cancel
              </Button>
              <Button variant="primary" onClick={handleApprove} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approve Drawing
              </Button>
            </>
          )}

          {drawing.status === "approved" && (
            <Button variant="primary" onClick={handleDisburse} className="gap-2">
              <CreditCard className="h-4 w-4" />
              Disburse Payout
            </Button>
          )}

          {drawing.status === "disbursed" && (
            <Button variant="ghost" onClick={handleReverse} className="text-red-600 gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Reverse Drawing
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 text-base border-b pb-3">Drawing Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Recipient Name</p>
              <p className="font-semibold text-gray-900 mt-0.5">{drawing.recipient_name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Role / Designation</p>
              <p className="font-semibold text-gray-900 mt-0.5">{drawing.recipient_role}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Drawing Date</p>
              <p className="text-gray-900 mt-0.5">{drawing.drawing_date}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Payment Method</p>
              <p className="text-gray-900 mt-0.5 capitalize">{drawing.payment_method}</p>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-gray-500">Disbursement Treasury Account</p>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-blue-600" />
                {drawing.financial_account_name} ({drawing.financial_account_code})
              </p>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-gray-500">Purpose / Justification</p>
              <p className="text-gray-800 mt-0.5 bg-gray-50 p-3 rounded-lg border">{drawing.reason}</p>
            </div>

            {drawing.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Remarks</p>
                <p className="text-gray-700 mt-0.5 italic">{drawing.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Side Panel: Amount & Audit */}
        <div className="space-y-6">
          <Card className="p-5 shadow-sm space-y-3 bg-rose-50/50 border-rose-200">
            <p className="text-xs font-semibold text-rose-900 uppercase">Withdrawal Amount</p>
            <p className="text-3xl font-extrabold text-rose-950">{formatMoney(drawing.amount)}</p>
            <p className="text-xs text-rose-800">Non-Operating Equity Outflow</p>
          </Card>

          <Card className="p-5 shadow-sm space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-500" />
              Governance & Audit Trail
            </h4>

            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-semibold text-gray-900">Requested</p>
                <p className="text-gray-500">By: {drawing.requested_by_name}</p>
                <p className="text-gray-400">{drawing.created_at?.split("T")[0]}</p>
              </div>

              {drawing.approved_at && (
                <div className="border-l-2 border-emerald-500 pl-3">
                  <p className="font-semibold text-gray-900">Approved</p>
                  <p className="text-gray-500">By: {drawing.approved_by_name}</p>
                  <p className="text-gray-400">{drawing.approved_at?.split("T")[0]}</p>
                </div>
              )}

              {drawing.status === "disbursed" && (
                <div className="border-l-2 border-purple-500 pl-3">
                  <p className="font-semibold text-gray-900">Disbursed via Treasury</p>
                  <p className="font-mono text-purple-700">TX: {drawing.treasury_transaction_number}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

