"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ReceivablesAging } from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Clock,
  ArrowLeft,
  RefreshCw,
  Coins,
  FileText,
  Users,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Calendar,
} from "lucide-react";

export default function ReceivablesAgingPage() {
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [agingData, setAgingData] = useState<ReceivablesAging | null>(null);
  const [activeTab, setActiveTab] = useState<"customers" | "invoices">("customers");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAging = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getReceivablesAging({ as_of_date: asOfDate });
      setAgingData(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to calculate receivables aging.");
      }
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    loadAging();
  }, [loadAging]);

  const formatBDT = (val: string | number | undefined) => {
    const num = parseFloat(String(val || "0"));
    return `৳${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/customers/receivables"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Receivables Aging Analysis
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              5-bucket chronological debt breakdown calculated as of {agingData?.as_of_date || asOfDate}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">As Of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="text-xs border-none bg-transparent focus:outline-none font-mono text-gray-800"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadAging}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Aging KPI Summary */}
      {agingData && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-4 bg-emerald-50/50 border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Current (Not Due)
            </div>
            <div className="text-lg font-bold font-mono text-emerald-900 mt-1">
              {formatBDT(agingData.summary.current)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Within credit terms</div>
          </Card>

          <Card className="p-4 bg-yellow-50/50 border-yellow-100">
            <div className="text-[11px] font-semibold text-yellow-800 uppercase tracking-wider">
              1 – 30 Days Overdue
            </div>
            <div className="text-lg font-bold font-mono text-yellow-900 mt-1">
              {formatBDT(agingData.summary.days_1_30)}
            </div>
            <div className="text-[10px] text-yellow-600 mt-0.5">First reminder tier</div>
          </Card>

          <Card className="p-4 bg-amber-50/50 border-amber-100">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              31 – 60 Days Overdue
            </div>
            <div className="text-lg font-bold font-mono text-amber-900 mt-1">
              {formatBDT(agingData.summary.days_31_60)}
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">Formal collection tier</div>
          </Card>

          <Card className="p-4 bg-orange-50/50 border-orange-100">
            <div className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider">
              61 – 90 Days Overdue
            </div>
            <div className="text-lg font-bold font-mono text-orange-900 mt-1">
              {formatBDT(agingData.summary.days_61_90)}
            </div>
            <div className="text-[10px] text-orange-600 mt-0.5">High credit risk</div>
          </Card>

          <Card className="p-4 bg-rose-50/60 border-rose-200">
            <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
              &gt; 90 Days Overdue
            </div>
            <div className="text-lg font-bold font-mono text-rose-900 mt-1">
              {formatBDT(agingData.summary.days_over_90)}
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5">Default / Bad debt</div>
          </Card>

          <Card className="p-4 bg-slate-900 text-white border-slate-800">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Total Outstanding
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatBDT(agingData.summary.total_outstanding)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">All aging buckets</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6">
        <button
          type="button"
          onClick={() => setActiveTab("customers")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "customers"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Customer Summary ({agingData?.customers.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "invoices"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoice Drill-Down ({agingData?.invoices.length || 0})
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm">Calculating debt aging across open subledger balances...</p>
        </div>
      ) : activeTab === "customers" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4 text-right">Current</th>
                  <th className="py-3 px-4 text-right">1 – 30 Days</th>
                  <th className="py-3 px-4 text-right">31 – 60 Days</th>
                  <th className="py-3 px-4 text-right">61 – 90 Days</th>
                  <th className="py-3 px-4 text-right">&gt; 90 Days</th>
                  <th className="py-3 px-4 text-right">Total Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!agingData || agingData.customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                      No active customer receivables outstanding as of {asOfDate}.
                    </td>
                  </tr>
                ) : (
                  agingData.customers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <Link href={`/customers/${c.customer_id}`} className="hover:underline text-indigo-600">
                          {c.customer_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">
                        {formatBDT(c.current)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">
                        {formatBDT(c.days_1_30)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700">
                        {formatBDT(c.days_31_60)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-orange-700">
                        {formatBDT(c.days_61_90)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700 font-semibold">
                        {formatBDT(c.days_over_90)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {formatBDT(c.total)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link href={`/customers/${c.customer_id}/statement`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            Statement
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
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Overdue Days</th>
                  <th className="py-3 px-4 text-center">Aging Bucket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!agingData || agingData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                      No unpaid invoices found as of {asOfDate}.
                    </td>
                  </tr>
                ) : (
                  agingData.invoices.map((inv) => (
                    <tr key={inv.invoice_number} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <Link href={`/customers/${inv.customer_id}`} className="hover:underline text-gray-800">
                          {inv.customer_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {inv.invoice_date}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {inv.due_date}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">
                        {formatBDT(inv.grand_total)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {formatBDT(inv.outstanding_balance)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {inv.overdue_days > 0 ? (
                          <span className="text-rose-600 font-semibold">{inv.overdue_days}d</span>
                        ) : (
                          <span className="text-emerald-600">0d</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.bucket === "current" && (
                          <Badge variant="success" className="text-xs">Current</Badge>
                        )}
                        {inv.bucket === "days_1_30" && (
                          <Badge variant="warning" className="text-xs">1–30d</Badge>
                        )}
                        {inv.bucket === "days_31_60" && (
                          <Badge variant="warning" className="text-xs bg-amber-100 text-amber-800">31–60d</Badge>
                        )}
                        {inv.bucket === "days_61_90" && (
                          <Badge variant="danger" className="text-xs bg-orange-100 text-orange-800">61–90d</Badge>
                        )}
                        {inv.bucket === "days_over_90" && (
                          <Badge variant="danger" className="text-xs">&gt;90d Overdue</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
