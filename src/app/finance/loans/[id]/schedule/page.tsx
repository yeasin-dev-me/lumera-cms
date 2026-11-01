"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { LoanContract } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  Calendar,
  PlusCircle,
  RefreshCw,
  Save,
} from "lucide-react";

export default function LoanSchedulePage() {
  const params = useParams();
  const id = params.id as string;

  const [loan, setLoan] = useState<LoanContract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Schedule Generator
  const [numInstallments, setNumInstallments] = useState<number>(6);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getLoanContract(id);
      setLoan(data);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load loan schedule.");
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

  const handleGenerateEqualSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    try {
      setGenerating(true);
      setError(null);
      setSuccessMsg(null);

      const principalTotal = Number(loan.principal_amount);
      const perInst = Number((principalTotal / numInstallments).toFixed(2));
      const installments = [];
      const baseDate = new Date(startDate);

      let accumulated = 0;
      for (let i = 1; i <= numInstallments; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const dueStr = d.toISOString().split("T")[0];

        let pDue = perInst;
        if (i === numInstallments) {
          pDue = Number((principalTotal - accumulated).toFixed(2));
        } else {
          accumulated += perInst;
        }

        installments.push({
          installment_number: i,
          due_date: dueStr,
          principal_due: pDue.toFixed(2),
          interest_due: "0.00",
        });
      }

      await adminApi.generateLoanSchedule(loan.id, installments);
      setSuccessMsg(`Generated ${numInstallments} monthly installments reconciling to ${formatMoney(loan.principal_amount)}.`);
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to generate schedule.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !loan) {
    return <div className="p-8 text-center text-gray-500">Loading schedule...</div>;
  }

  if (!loan) {
    return (
      <div className="p-8 text-center text-red-500">
        Loan not found. <Link href="/finance/loans" className="underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/finance/loans/${loan.id}`} className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> {loan.contract_number}
            </Link>
            <span>/</span>
            <span>Repayment Schedule</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Contract Repayment Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            Amortization and installment timeline for {loan.lender_name} ({formatMoney(loan.principal_amount)})
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Schedule Generator Box if no schedule exists */}
      {(!loan.schedules || loan.schedules.length === 0) && (
        <Card className="p-6 shadow-sm border-blue-200 bg-blue-50/30">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">Generate Equal Principal Installments</h3>
          <p className="text-xs text-gray-600 mb-4">
            Automatically calculate monthly installments totaling exactly {formatMoney(loan.principal_amount)}.
          </p>
          <form onSubmit={handleGenerateEqualSchedule} className="flex flex-wrap items-end gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Number of Installments</label>
              <input
                type="number"
                min="1"
                max="60"
                value={numInstallments}
                onChange={(e) => setNumInstallments(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 w-32 border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Due Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-3 py-1.5 border-gray-300"
              />
            </div>
            <Button type="submit" variant="primary" disabled={generating} className="gap-1.5">
              <Save className="h-4 w-4" />
              {generating ? "Generating..." : "Generate Schedule"}
            </Button>
          </form>
        </Card>
      )}

      {/* Schedule Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Inst #</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Principal Due</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Interest Due</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total Due</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Principal Paid</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Interest Paid</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {!loan.schedules || loan.schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No repayment schedule created yet.
                  </td>
                </tr>
              ) : (
                loan.schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center font-bold text-gray-700">#{s.installment_number}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.due_date}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatMoney(s.principal_due)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatMoney(s.interest_due)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(s.total_due)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(s.principal_paid)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(s.interest_paid)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          s.status === "paid"
                            ? "success"
                            : s.status === "partially_paid"
                            ? "accent"
                            : s.status === "overdue"
                            ? "danger"
                            : "muted"
                        }
                      >
                        {s.status_display}
                      </Badge>
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

