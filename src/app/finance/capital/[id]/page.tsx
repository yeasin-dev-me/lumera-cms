"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CapitalContribution } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  PiggyBank,
  CheckCircle2,
  RotateCcw,
  Clock,
  Landmark,
} from "lucide-react";

export default function CapitalContributionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [contribution, setContribution] = useState<CapitalContribution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getCapitalContribution(id);
      setContribution(data);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load capital contribution.");
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

  const handleVerify = async () => {
    if (!contribution) return;
    if (!confirm(`Confirm receipt of ${formatMoney(contribution.amount)} into ${contribution.financial_account_name}? This will book a Treasury inflow.`)) {
      return;
    }
    try {
      setError(null);
      await adminApi.verifyCapitalContribution(contribution.id);
      setSuccessMsg("Capital contribution verified. Funds received into Treasury account.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Verification failed.");
    }
  };

  const handleReverse = async () => {
    if (!contribution) return;
    const reason = prompt("Enter reason for reversing this capital contribution:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.reverseCapitalContribution(contribution.id, reason);
      setSuccessMsg("Capital contribution reversed. Compensating Treasury outflow booked.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Reversal failed.");
    }
  };

  const handleCancel = async () => {
    if (!contribution) return;
    const reason = prompt("Enter reason for cancelling this pending contribution:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.cancelCapitalContribution(contribution.id, reason);
      setSuccessMsg("Contribution cancelled.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Cancellation failed.");
    }
  };

  if (loading && !contribution) {
    return <div className="p-8 text-center text-gray-500">Loading contribution details...</div>;
  }

  if (!contribution) {
    return (
      <div className="p-8 text-center text-red-500">
        Record not found. <Link href="/finance/capital" className="underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/finance/capital" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Capital Contributions
            </Link>
            <span>/</span>
            <span className="font-mono">{contribution.contribution_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{contribution.contribution_number}</h1>
            <Badge
              variant={
                contribution.status === "verified"
                  ? "success"
                  : contribution.status === "pending"
                  ? "warning"
                  : "muted"
              }
            >
              {contribution.status_display}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contribution.status === "pending" && (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleVerify} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Verify & Receive Funds
              </Button>
            </>
          )}
          {contribution.status === "verified" && (
            <Button variant="ghost" onClick={handleReverse} className="text-red-600 gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Reverse Contribution
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 text-base border-b pb-3">Contribution Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Contributor Name</p>
              <p className="font-semibold text-gray-900 mt-0.5">{contribution.contributor_name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Contributor Type</p>
              <p className="font-semibold text-gray-900 mt-0.5">{contribution.contributor_type_display}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Contribution Date</p>
              <p className="text-gray-900 mt-0.5">{contribution.contribution_date}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Payment Method</p>
              <p className="text-gray-900 mt-0.5 capitalize">{contribution.payment_method}</p>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-gray-500">Deposit Treasury Account</p>
              <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-blue-600" />
                {contribution.financial_account_name} ({contribution.financial_account_code})
              </p>
            </div>

            {contribution.reference_note && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Reference Notes</p>
                <p className="text-gray-800 mt-0.5 bg-gray-50 p-3 rounded-lg border">{contribution.reference_note}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Side Panel: Amount & Audit */}
        <div className="space-y-6">
          <Card className="p-5 shadow-sm space-y-3 bg-indigo-50/50 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-900 uppercase">Contribution Amount</p>
            <p className="text-3xl font-extrabold text-indigo-950">{formatMoney(contribution.amount)}</p>
            <p className="text-xs text-indigo-800">Operating Currency: {contribution.currency}</p>
          </Card>

          <Card className="p-5 shadow-sm space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-500" />
              Audit & Verification
            </h4>

            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-semibold text-gray-900">Recorded</p>
                <p className="text-gray-500">By: {contribution.recorded_by_name}</p>
                <p className="text-gray-400">{contribution.created_at?.split("T")[0]}</p>
              </div>

              {contribution.verified_at && (
                <div className="border-l-2 border-emerald-500 pl-3">
                  <p className="font-semibold text-gray-900">Verified & Inflow Booked</p>
                  <p className="text-gray-500">By: {contribution.verified_by_name}</p>
                  <p className="text-gray-400">{contribution.verified_at?.split("T")[0]}</p>
                  <p className="font-mono text-emerald-700 mt-1">TX: {contribution.treasury_transaction_number}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

