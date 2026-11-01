"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CapitalContribution } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  PiggyBank,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Eye,
  FileText,
} from "lucide-react";

export default function CapitalContributionsPage() {
  const [contributions, setContributions] = useState<CapitalContribution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getCapitalContributions();
      setContributions(res.results || []);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load capital contributions.");
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

  const handleVerify = async (c: CapitalContribution) => {
    if (!confirm(`Verify and confirm receipt of ${formatMoney(c.amount)} into ${c.financial_account_name}? This will book a Treasury inflow.`)) {
      return;
    }
    try {
      setError(null);
      setSuccessMsg(null);
      await adminApi.verifyCapitalContribution(c.id);
      setSuccessMsg(`Capital contribution ${c.contribution_number} verified and funds received.`);
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Verification failed.");
    }
  };

  const handleReverse = async (c: CapitalContribution) => {
    const reason = prompt(`Enter reason for reversing capital contribution ${c.contribution_number}:`);
    if (reason === null) return;
    try {
      setError(null);
      setSuccessMsg(null);
      await adminApi.reverseCapitalContribution(c.id, reason);
      setSuccessMsg(`Capital contribution ${c.contribution_number} reversed.`);
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Reversal failed.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Capital Contributions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verified capital injections into business financial accounts (strictly segregated from operating income and debt)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/finance/capital/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Contribution
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Contribution #</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Contributor</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Contributor Type</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Deposit Account</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Treasury TX</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && contributions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading capital contributions...
                  </td>
                </tr>
              ) : contributions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No capital contributions recorded.
                  </td>
                </tr>
              ) : (
                contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">
                      <Link href={`/finance/capital/${c.id}`} className="hover:underline">
                        {c.contribution_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.contribution_date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.contributor_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <Badge variant="muted">{c.contributor_type_display}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-gray-900">{c.financial_account_name}</span>
                      <span className="font-mono text-gray-400 text-[10px] ml-1">({c.financial_account_code})</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(c.amount)}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                      {c.treasury_transaction_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          c.status === "verified"
                            ? "success"
                            : c.status === "pending"
                            ? "warning"
                            : "muted"
                        }
                      >
                        {c.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === "pending" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleVerify(c)}
                            className="text-xs"
                          >
                            Verify Receipt
                          </Button>
                        )}
                        {c.status === "verified" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReverse(c)}
                            className="text-red-600 gap-1 text-xs"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reverse
                          </Button>
                        )}
                        <Link href={`/finance/capital/${c.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </Link>
                      </div>
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

