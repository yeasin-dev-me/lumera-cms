"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseDisbursement } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CreditCard,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

export default function ExpenseDisbursementsPage() {
  const [disbursements, setDisbursements] = useState<ExpenseDisbursement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getExpenseDisbursements();
      setDisbursements(res.results || []);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load expense disbursements.");
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

  const handleReverse = async (disb: ExpenseDisbursement) => {
    const reason = prompt(`Enter reason for reversing disbursement ${disb.disbursement_number}:`);
    if (reason === null) return;
    try {
      setError(null);
      setSuccessMsg(null);
      await adminApi.reverseExpenseDisbursement(disb.id, reason);
      setSuccessMsg(`Disbursement ${disb.disbursement_number} reversed. Compensating Treasury inflow booked.`);
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
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/expenses" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Expenses
            </Link>
            <span>/</span>
            <span>Disbursements</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Disbursement Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Historical record of all Treasury payouts disbursed against approved expense vouchers
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Disbursement #</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Voucher</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Treasury Account</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Payment Method</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Disbursed Amount</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Treasury TX</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && disbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading disbursement records...
                  </td>
                </tr>
              ) : disbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No expense disbursements recorded yet.
                  </td>
                </tr>
              ) : (
                disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">{d.disbursement_number}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{d.disbursement_date}</td>
                    <td className="px-4 py-3 text-xs">
                      <Link href={`/expenses/vouchers/${d.voucher}`} className="text-blue-600 hover:underline font-mono">
                        Voucher #{d.voucher}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-gray-900">{d.financial_account_name}</span>
                      <span className="font-mono text-gray-400 text-[10px] ml-1">({d.financial_account_code})</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{d.payment_method_display}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(d.amount)}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                      {d.treasury_transaction_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.status === "completed" ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="muted">Reversed</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReverse(d)}
                          className="text-red-600 gap-1 text-xs"
                          title="Reverse this disbursement"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reverse
                        </Button>
                      )}
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

