"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CustomerStatement } from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  Coins,
  TrendingDown,
  Clock,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

export default function CustomerStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatement = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getCustomerStatement(customerId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setStatement(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to generate customer statement.");
      }
    } finally {
      setLoading(false);
    }
  }, [customerId, startDate, endDate]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  const handlePrint = () => {
    window.print();
  };

  const getPdfUrl = () => {
    const qs = new URLSearchParams();
    if (startDate) qs.set("start_date", startDate);
    if (endDate) qs.set("end_date", endDate);
    const queryString = qs.toString() ? `?${qs.toString()}` : "";
    return `/api/v1/admin/customers/profiles/${encodeURIComponent(customerId)}/statement/pdf/${queryString}`;
  };

  const getCsvUrl = () => {
    const qs = new URLSearchParams();
    if (startDate) qs.set("start_date", startDate);
    if (endDate) qs.set("end_date", endDate);
    const queryString = qs.toString() ? `?${qs.toString()}` : "";
    return `/api/v1/admin/customers/profiles/${encodeURIComponent(customerId)}/statement/csv/${queryString}`;
  };

  const formatBDT = (val: string | number | undefined) => {
    const num = parseFloat(String(val || "0"));
    return `৳${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:max-w-full">
      {/* Top Header - Hidden in Print */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/customers/${customerId}`}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Customer Statement of Account
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sequential ledger entries, period debits, credits, and running balance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <a href={getPdfUrl()} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>
          </a>
          <a href={getCsvUrl()} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Date Filter Bar - Hidden in Print */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          Statement Period:
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadStatement}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Update Range
        </Button>
      </div>

      {/* Messages */}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm">Generating customer statement...</p>
        </div>
      ) : statement ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
            <div>
              <div className="text-xl font-black text-gray-900 tracking-wider">
                {statement.company_name || "PENGUIN MART"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Official Subledger Statement of Account</p>
              <p className="text-xs text-gray-500">Operating Currency: BDT (৳)</p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-sm font-semibold text-gray-900">
                Statement Date:{" "}
                <span className="font-mono text-gray-700">
                  {new Date(statement.generated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Period:{" "}
                <span className="font-medium text-gray-800">
                  {statement.start_date || "Genesis"} — {statement.end_date || "Present"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-5 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Customer Information
              </div>
              <div className="text-base font-bold text-gray-900">{statement.customer_name}</div>
              {statement.business_name && (
                <div className="text-sm text-gray-700 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {statement.business_name}
                </div>
              )}
              {statement.tax_identifier && (
                <div className="text-xs text-gray-500 mt-0.5">
                  TIN / BIN: <span className="font-mono font-medium">{statement.tax_identifier}</span>
                </div>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Account Details
              </div>
              <div className="text-xs text-gray-600">
                Customer ID: <span className="font-mono font-semibold text-gray-800">#{statement.customer_id}</span>
              </div>
              <div className="text-xs text-gray-600">
                Account Type: <span className="font-medium capitalize text-gray-800">{statement.customer_type}</span>
              </div>
              {statement.customer_email && (
                <div className="text-xs text-gray-500 flex sm:justify-end items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  {statement.customer_email}
                </div>
              )}
              {statement.customer_phone && (
                <div className="text-xs text-gray-500 flex sm:justify-end items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {statement.customer_phone}
                </div>
              )}
            </div>
          </div>

          {/* Period Financial Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 uppercase">Opening Balance</div>
              <div className="text-lg font-bold font-mono text-gray-900 mt-1">
                {formatBDT(statement.opening_balance)}
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <div className="text-xs font-semibold text-indigo-700 uppercase">Period Debits (+)</div>
              <div className="text-lg font-bold font-mono text-indigo-900 mt-1">
                {formatBDT(statement.total_period_debits)}
              </div>
              <div className="text-[10px] text-indigo-600 mt-0.5">Invoices issued</div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <div className="text-xs font-semibold text-emerald-700 uppercase">Period Credits (-)</div>
              <div className="text-lg font-bold font-mono text-emerald-900 mt-1">
                {formatBDT(statement.total_period_credits)}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Receipts & Credit Notes</div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <div className="text-xs font-semibold text-slate-300 uppercase">Closing Balance</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatBDT(statement.closing_balance)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Outstanding Receivable</div>
            </div>
          </div>

          {/* Statement Entries Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Transaction Ledger ({statement.entries.length} Entries)
              </h3>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Entry #</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right font-bold">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statement.entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        No transactions recorded during this statement period.
                      </td>
                    </tr>
                  ) : (
                    statement.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/70">
                        <td className="py-2.5 px-3 font-mono text-gray-700 whitespace-nowrap">
                          {entry.effective_date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-gray-800">
                          {entry.entry_number}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="muted" className="text-[10px] capitalize">
                            {entry.entry_type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">
                          {entry.source_reference || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 max-w-xs truncate" title={entry.description}>
                          {entry.description}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                          {entry.due_date || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                          {parseFloat(entry.debit_amount) > 0 ? formatBDT(entry.debit_amount) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-medium">
                          {parseFloat(entry.credit_amount) > 0 ? formatBDT(entry.credit_amount) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          {formatBDT(entry.running_balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Footer */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-700">Payment Remittance Notice:</p>
            <p>
              Please quote customer account #{statement.customer_id} on all payment transfers.
              Inquiries regarding this statement should be directed to the Penguin Mart Accounts Department.
            </p>
            <p className="text-[11px] text-gray-400">
              Generated by Penguin Mart BMS/ERP on {new Date(statement.generated_at).toLocaleString()}.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
