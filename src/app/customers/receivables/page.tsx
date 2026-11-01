"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ReceivablesSummary, OutstandingInvoiceSummary } from "@/types/customers";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Coins,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  PlusCircle,
  FileText,
  Loader2,
  X,
  CreditCard,
  CheckCircle2,
  Users,
} from "lucide-react";

export default function CustomerReceivablesPage() {
  const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
  const [invoices, setInvoices] = useState<OutstandingInvoiceSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Payment Allocation Modal
  const [showAllocateModal, setShowAllocateModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OutstandingInvoiceSummary | null>(null);
  const [allocReceiptEntryId, setAllocReceiptEntryId] = useState<string>("");
  const [allocInvoiceId, setAllocInvoiceId] = useState<string>("");
  const [allocAmount, setAllocAmount] = useState<string>("");
  const [allocReference, setAllocReference] = useState<string>("");
  const [submittingAlloc, setSubmittingAlloc] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, invRes] = await Promise.all([
        adminApi.getReceivablesSummary(),
        adminApi.getOutstandingInvoices(),
      ]);
      setSummary(sumRes);
      setInvoices(invRes);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load receivables data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAllocateModal = (inv?: OutstandingInvoiceSummary) => {
    if (inv) {
      setSelectedInvoice(inv);
      setAllocInvoiceId(String(inv.id));
      setAllocAmount(inv.outstanding_balance);
    } else {
      setSelectedInvoice(null);
      setAllocInvoiceId("");
      setAllocAmount("");
    }
    setAllocReceiptEntryId("");
    setAllocReference("");
    setShowAllocateModal(true);
  };

  const closeAllocateModal = () => {
    setShowAllocateModal(false);
    setSelectedInvoice(null);
    setAllocReceiptEntryId("");
    setAllocInvoiceId("");
    setAllocAmount("");
    setAllocReference("");
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const receiptId = parseInt(allocReceiptEntryId, 10);
    const invoiceId = parseInt(allocInvoiceId, 10);
    const amount = allocAmount.trim();

    if (!receiptId || !invoiceId || !amount) {
      setError("Receipt Entry ID, Invoice ID, and Allocated Amount are required.");
      return;
    }

    try {
      setSubmittingAlloc(true);
      setError(null);
      await adminApi.createPaymentAllocation({
        receipt_entry_id: receiptId,
        invoice_id: invoiceId,
        amount: amount,
        idempotency_key: allocReference.trim() || undefined,
      });
      setSuccessMsg(`Successfully allocated ৳${amount} to invoice #${invoiceId}.`);
      closeAllocateModal();
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create payment allocation.");
      }
    } finally {
      setSubmittingAlloc(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Customer Receivables Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative subledger overview of customer trade debts, unallocated advances, and unpaid sales invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/customers/receivables/aging">
            <Button variant="secondary" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Clock className="h-4 w-4 mr-1.5" />
              Aging Analysis
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAllocateModal()}
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Allocate Payment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase">Total Receivables</span>
              <Coins className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-2">
              ৳{parseFloat(summary.total_outstanding_receivables || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Active Debtors: <span className="font-semibold text-gray-700">{summary.customers_with_balance_count}</span>
            </div>
          </Card>

          <Card className="p-5 bg-rose-50/50 border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase">Total Overdue</span>
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-2">
              ৳{parseFloat(summary.total_overdue_receivables || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-rose-600 mt-1">
              Delinquent Accounts: <span className="font-semibold">{summary.overdue_customers_count}</span>
            </div>
          </Card>

          <Card className="p-5 bg-emerald-50/50 border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Unallocated Advances</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
              ৳{parseFloat(summary.total_unallocated_advances || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              Customer deposits awaiting allocation
            </div>
          </Card>

          <Card className="p-5 bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase">Aging Breakdown</span>
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Inspect overdue invoices bucketed across 30, 60, and 90+ days.
            </p>
            <Link
              href="/customers/receivables/aging"
              className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-3"
            >
              View Aging Report <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Card>
        </div>
      )}

      {/* Outstanding Invoices Section */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Outstanding Sales Invoices ({invoices.length})
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm">Loading outstanding invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-base font-medium text-gray-700">No outstanding invoices</p>
            <p className="text-sm text-gray-500">All customer invoices have been fully paid or settled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Overdue Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                      <Link href={`/sales/invoices/${inv.id}`} className="hover:underline flex items-center gap-1">
                        {inv.invoice_number}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {inv.customer_id ? (
                        <Link href={`/customers/${inv.customer_id}`} className="hover:underline text-gray-800">
                          {inv.customer_name}
                        </Link>
                      ) : (
                        <span>{inv.customer_name || "Guest Customer"}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="muted" className="capitalize text-xs">
                        {inv.sales_channel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                      {inv.invoice_date}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                      {inv.due_date || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-700">
                      ৳{parseFloat(inv.grand_total || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      ৳{parseFloat(inv.outstanding_balance || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.overdue_days > 0 ? (
                        <Badge variant="danger" className="text-xs">
                          {inv.overdue_days}d overdue
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openAllocateModal(inv)}
                        className="text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                      >
                        Allocate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payment Allocation Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Allocate Payment to Invoice</h3>
              </div>
              <button
                type="button"
                onClick={closeAllocateModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedInvoice && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-indigo-900">Invoice: {selectedInvoice.invoice_number}</p>
                <p className="text-indigo-800">Customer: {selectedInvoice.customer_name}</p>
                <p className="text-indigo-700 font-mono">
                  Outstanding: ৳{parseFloat(selectedInvoice.outstanding_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Receipt Entry ID *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={allocReceiptEntryId}
                  onChange={(e) => setAllocReceiptEntryId(e.target.value)}
                  placeholder="ID of verified CustomerLedgerEntry (entry_type=payment)"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Corresponds to the ledger entry ID of the unallocated customer advance payment.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sales Invoice ID *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={allocInvoiceId}
                  onChange={(e) => setAllocInvoiceId(e.target.value)}
                  placeholder="Sales invoice database ID"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Allocated Amount (৳ BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Cannot exceed the unallocated receipt balance or the remaining invoice balance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Allocation Reference / Remarks
                </label>
                <input
                  type="text"
                  value={allocReference}
                  onChange={(e) => setAllocReference(e.target.value)}
                  placeholder="e.g., Settlement for Order #ORD-1002"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeAllocateModal}
                  disabled={submittingAlloc}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingAlloc}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {submittingAlloc ? "Allocating..." : "Confirm Allocation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
