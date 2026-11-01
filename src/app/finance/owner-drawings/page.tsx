"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { OwnerDrawing } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  TrendingDown,
  PlusCircle,
  RefreshCw,
  Eye,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

export default function OwnerDrawingsPage() {
  const [drawings, setDrawings] = useState<OwnerDrawing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getOwnerDrawings();
      setDrawings(res.results || []);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load owner drawings.");
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Owner & Partner Drawings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Non-operating personal equity withdrawals backed by Treasury outflows (strictly excluded from operating expenses)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/finance/owner-drawings/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Drawing Request
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
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Drawing #</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Beneficiary Recipient</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Reason / Memo</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Treasury Account</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Treasury TX</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && drawings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading owner drawings...
                  </td>
                </tr>
              ) : drawings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No owner drawings recorded. Click &quot;New Drawing Request&quot; to log equity withdrawal.
                  </td>
                </tr>
              ) : (
                drawings.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">
                      <Link href={`/finance/owner-drawings/${d.id}`} className="hover:underline">
                        {d.drawing_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{d.drawing_date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {d.recipient_name}
                      <span className="text-xs text-gray-500 block">{d.recipient_role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-xs">{d.reason}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-gray-900">{d.financial_account_name}</span>
                      <span className="font-mono text-gray-400 text-[10px] ml-1">({d.financial_account_code})</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatMoney(d.amount)}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                      {d.treasury_transaction_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          d.status === "disbursed"
                            ? "success"
                            : d.status === "approved"
                            ? "primary"
                            : d.status === "pending_approval"
                            ? "warning"
                            : "muted"
                        }
                      >
                        {d.status_display}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/finance/owner-drawings/${d.id}`}>
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

