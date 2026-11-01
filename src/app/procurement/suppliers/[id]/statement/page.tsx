"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SupplierStatement } from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
  Printer,
  ArrowLeft,
  Calendar,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  Coins,
  ShieldAlert,
  Clock,
  Loader2,
  ExternalLink,
  Receipt,
  Info,
} from "lucide-react";

export default function SupplierStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const supplierId = resolvedParams.id;

  const [statement, setStatement] = useState<SupplierStatement | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatement = useCallback(async () => {
    if (!supplierId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSupplierStatement(supplierId, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setStatement(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to generate supplier statement.");
      }
    } finally {
      setLoading(false);
    }
  }, [supplierId, startDate, endDate]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  const handlePrint = () => {
    window.print();
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
            href={`/procurement/suppliers/${supplierId}`}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Supplier Statement of Account
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Authoritative procurement billing summary of posted purchase bills and acquisition liabilities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print Statement
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadStatement}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Date Filter Bar - Hidden in Print */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          Filter Bill Period:
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

      {/* Step 06 Treasury Boundary Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-semibold text-sm">Step 06 Treasury Separation Boundary</p>
          <p className="text-blue-800 leading-relaxed">
            This statement reflects all posted acquisition bills and landed cost charges recorded in the procurement domain.
            Actual cash disbursements, bank transfers, cheque clearances, and balance settlement will be managed by the
            integrated Step 06 Treasury and Step 08 General Ledger modules.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm">Generating supplier statement...</p>
        </div>
      ) : statement ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
            <div>
              <div className="text-xl font-black text-gray-900 tracking-wider">
                PENGUIN MART
              </div>
              <p className="text-xs text-gray-500 mt-1">Procurement & Payables Statement</p>
              <p className="text-xs text-gray-500">Operating Currency: BDT (৳)</p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-sm font-semibold text-gray-900">
                Generated:{" "}
                <span className="font-mono text-gray-700">
                  {new Date(statement.generated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Period:{" "}
                <span className="font-medium text-gray-800">
                  {statement.statement_period.start_date || "Genesis"} — {statement.statement_period.end_date || "Present"}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier Master Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-5 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Supplier Information
              </div>
              <div className="text-base font-bold text-gray-900">{statement.supplier_name}</div>
              <div className="text-xs font-mono text-gray-500 mt-0.5">Code: {statement.supplier_code}</div>
              {statement.contact_person && (
                <div className="text-sm text-gray-700 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Contact: {statement.contact_person}
                </div>
              )}
              {statement.tax_id && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Tax / VAT ID: <span className="font-mono font-medium">{statement.tax_id}</span>
                </div>
              )}
              {statement.address && (
                <div className="text-xs text-gray-500 mt-1 max-w-sm">
                  {statement.address}
                </div>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Commercial Terms
              </div>
              <div className="text-xs text-gray-600">
                Payment Terms: <span className="font-semibold text-gray-800">{statement.payment_terms_days} days</span>
              </div>
              {statement.email && (
                <div className="text-xs text-gray-500 flex sm:justify-end items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  {statement.email}
                </div>
              )}
              {statement.phone && (
                <div className="text-xs text-gray-500 flex sm:justify-end items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {statement.phone}
                </div>
              )}
            </div>
          </div>

          {/* Statement Financial Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 uppercase">Bills Count</div>
              <div className="text-xl font-bold font-mono text-gray-900 mt-1">
                {statement.summary.total_bills_count}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Posted purchase bills</div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 uppercase">Raw Subtotal</div>
              <div className="text-lg font-bold font-mono text-gray-900 mt-1">
                {formatBDT(statement.summary.total_raw_subtotal)}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Goods invoice value</div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <div className="text-xs font-semibold text-indigo-700 uppercase">Landed Costs</div>
              <div className="text-lg font-bold font-mono text-indigo-900 mt-1">
                {formatBDT(statement.summary.total_landed_costs)}
              </div>
              <div className="text-[10px] text-indigo-600 mt-0.5">Freight, customs & clearing</div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <div className="text-xs font-semibold text-slate-300 uppercase">Total Billed Payable</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatBDT(statement.summary.total_billed_payable)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Gross acquisition debt</div>
            </div>
          </div>

          {/* Bills Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Posted Purchase Bills ({statement.bills.length})
              </h3>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Bill Date</th>
                    <th className="py-2.5 px-3">Bill #</th>
                    <th className="py-2.5 px-3">Supplier Invoice Ref</th>
                    <th className="py-2.5 px-3">PO #</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Items</th>
                    <th className="py-2.5 px-3 text-right">Raw Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Landed Costs</th>
                    <th className="py-2.5 px-3 text-right font-bold">Total Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statement.bills.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        No purchase bills recorded for this supplier during the selected period.
                      </td>
                    </tr>
                  ) : (
                    statement.bills.map((b) => (
                      <tr key={b.bill_number} className="hover:bg-gray-50/70">
                        <td className="py-2.5 px-3 font-mono text-gray-700 whitespace-nowrap">
                          {b.bill_date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-indigo-600">
                          {b.bill_number}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-700">
                          {b.supplier_invoice_ref || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">
                          {b.purchase_order_number || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                          {b.due_date || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {b.items_count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          {formatBDT(b.subtotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                          {formatBDT(b.total_landed_costs)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          {formatBDT(b.total_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="success" className="text-[10px] capitalize">
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Footer */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">Note:</p>
            <p>
              This document lists all acquisition commitments and supplier invoices posted through Penguin Mart Procurement.
              Disbursements and bank settlements are processed via corporate treasury.
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
