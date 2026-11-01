"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { LoanContract } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Coins,
  PlusCircle,
  RefreshCw,
  Eye,
  ArrowRight,
  Landmark,
} from "lucide-react";

export default function LoanContractsPage() {
  const [loans, setLoans] = useState<LoanContract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getLoanContracts();
      setLoans(res.results || []);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load loan contracts.");
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Business Financing & Loan Agreements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative tracking of debt contracts, proceeds receipt, and principal/interest repayment schedules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/finance/loans/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Loan Agreement
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Contract #</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Lender</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Classification</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Interest Terms</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Principal</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Repaid</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Outstanding</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && loans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading loan contracts...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No loan contracts recorded. Click &quot;New Loan Agreement&quot; to log business debt.
                  </td>
                </tr>
              ) : (
                loans.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">
                      <Link href={`/finance/loans/${l.id}`} className="hover:underline">
                        {l.contract_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{l.lender_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.loan_classification_display}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {l.interest_type_display}
                      {l.interest_rate && ` (${l.interest_rate}%)`}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(l.principal_amount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(l.total_principal_repaid)}</td>
                    <td className="px-4 py-3 text-right text-amber-700 font-semibold">{formatMoney(l.outstanding_principal)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          l.status === "active"
                            ? "primary"
                            : l.status === "settled"
                            ? "success"
                            : l.status === "draft"
                            ? "muted"
                            : "warning"
                        }
                      >
                        {l.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/finance/loans/${l.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4 text-blue-600" />
                          View
                        </Button>
                      </Link>
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

