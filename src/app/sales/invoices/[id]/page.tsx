"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SalesInvoice } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  Printer,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Ban,
  X,
  CreditCard,
  User,
  ShoppingBag,
} from "lucide-react";

export default function SalesInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Void modal
  const [showVoidModal, setShowVoidModal] = useState<boolean>(false);
  const [voidReason, setVoidReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSalesInvoice(invoiceId);
      setInvoice(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load sales invoice details.");
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleIssueInvoice = async () => {
    if (!invoice) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await adminApi.issueSalesInvoice(invoice.id);
      setInvoice(updated);
      setSuccessMsg(`Invoice ${updated.invoice_number} successfully issued and stock deducted.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to issue invoice.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCredit = async () => {
    if (!invoice) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await adminApi.approveWholesaleCredit(invoice.id);
      setInvoice(updated);
      setSuccessMsg(`Credit terms for Invoice ${updated.invoice_number} approved.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to approve credit.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !voidReason.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await adminApi.voidSalesInvoice(invoice.id, voidReason);
      setShowVoidModal(false);
      setInvoice(updated);
      setSuccessMsg(`Invoice ${updated.invoice_number} voided.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to void invoice.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-600" />
        Loading invoice details...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Invoice not found.</p>
        <Link href="/sales/invoices">
          <Button variant="secondary">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const grandTotalNum = parseFloat(invoice.grand_total || "0");
  const totalCogsNum = (invoice.items || []).reduce(
    (sum, it) => sum + parseFloat(it.total_cogs || "0"),
    0
  );
  const grossProfit = grandTotalNum - totalCogsNum;
  const grossMarginPct = grandTotalNum > 0 ? (grossProfit / grandTotalNum) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sales/invoices">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {invoice.invoice_number}
              </h1>
              {invoice.channel === "online" ? (
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Online Storefront
                </span>
              ) : invoice.channel === "pos" ? (
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  POS Counter
                </span>
              ) : (
                <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  Wholesale
                </span>
              )}
              {invoice.status === "issued" ? (
                <Badge variant="success">Issued</Badge>
              ) : invoice.status === "draft" ? (
                <Badge variant="warning">Draft</Badge>
              ) : invoice.status === "void" ? (
                <Badge variant="danger">Void</Badge>
              ) : (
                <Badge variant="muted">{invoice.status}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Created on {new Date(invoice.created_at).toLocaleDateString()} • Due:{" "}
              {invoice.due_date || "Due on Receipt"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Download */}
          <a
            href={adminApi.getSalesInvoicePdfUrl(invoice.id)}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" size="sm">
              <Printer className="h-4 w-4 mr-1.5" />
              Print PDF
            </Button>
          </a>

          {/* Wholesale Manager Credit Approval */}
          {invoice.status === "draft" &&
            !invoice.credit_approved &&
            invoice.payment_terms !== "immediate" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleApproveCredit}
                disabled={actionLoading}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                Approve Credit Terms
              </Button>
            )}

          {/* Issue Draft Invoice */}
          {invoice.status === "draft" && (
            <Button
              size="sm"
              onClick={handleIssueInvoice}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <FileCheck className="h-4 w-4 mr-1.5" />
              Issue & Deduct Stock
            </Button>
          )}

          {/* Void Action */}
          {invoice.is_voidable && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowVoidModal(true)}
              disabled={actionLoading}
            >
              <Ban className="h-4 w-4 mr-1.5" />
              Void Invoice
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Card */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary-600" />
            Customer & Billing
          </span>
          <div>
            <h3 className="font-bold text-gray-900">{invoice.customer_name}</h3>
            {invoice.customer_phone && (
              <p className="text-xs text-gray-600">Phone: {invoice.customer_phone}</p>
            )}
            {invoice.customer_email && (
              <p className="text-xs text-gray-600">Email: {invoice.customer_email}</p>
            )}
          </div>
        </Card>

        {/* Commercial Terms & Channel */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Payment & Terms
          </span>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Tender Method:</span>
              <span className="font-semibold text-gray-900 uppercase">
                {invoice.tender_method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Terms:</span>
              <span className="font-semibold text-gray-900">{invoice.payment_terms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status:</span>
              <span className="font-bold text-gray-900">
                {invoice.payment_status === "paid" ? (
                  <span className="text-emerald-600">● Paid</span>
                ) : (
                  <span className="text-amber-600">○ Unpaid / Due</span>
                )}
              </span>
            </div>
            {invoice.credit_approved_by_email && (
              <div className="text-[11px] text-purple-700 bg-purple-50 p-1.5 rounded mt-1">
                Credit authorized by: {invoice.credit_approved_by_email}
              </div>
            )}
          </div>
        </Card>

        {/* Channel Linkages */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-blue-600" />
            Channel Traceability
          </span>
          <div className="text-xs space-y-1">
            {invoice.order_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">E-Commerce Order:</span>
                <span className="font-mono font-bold text-primary-600">
                  {invoice.order_number}
                </span>
              </div>
            )}
            {invoice.pos_session_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">POS Register Shift:</span>
                <Link
                  href="/sales/pos/sessions"
                  className="font-mono font-bold text-primary-600 hover:underline"
                >
                  {invoice.pos_session_number}
                </Link>
              </div>
            )}
            {invoice.payment_reference && (
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Ref / Slip:</span>
                <span className="font-mono text-gray-800">{invoice.payment_reference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Remaining Creditable:</span>
              <span className="font-bold text-emerald-700">
                ৳{invoice.remaining_creditable_amount || invoice.grand_total}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Line Items Table with Costing */}
      <Card className="overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm">
            Billed Items & Historical FIFO Costing Snapshot
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            {invoice.items?.length || 0} line items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Line Total</th>
                <th className="py-3 px-4 text-right">Unit FIFO Cost</th>
                <th className="py-3 px-4 text-right">Total COGS</th>
                <th className="py-3 px-4">Costing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {(invoice.items || []).map((it) => (
                <tr key={it.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{it.product_name}</div>
                    <div className="text-xs font-mono text-gray-400">{it.product_sku}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-gray-900">{it.quantity}</td>
                  <td className="py-3 px-4 text-right">৳{it.unit_price}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">৳{it.total}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">
                    {it.unit_cost ? `৳${it.unit_cost}` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-xs text-gray-700">
                    ৳{it.total_cogs}
                  </td>
                  <td className="py-3 px-4">
                    {it.costing_status === "fully_costed" ? (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Costed
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                        Uncosted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Breakdown & Profitability Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes */}
        <Card className="p-4 space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Notes & Terms
          </span>
          <p className="text-xs text-gray-700 whitespace-pre-line">
            {invoice.notes || "No additional invoice notes."}
          </p>
        </Card>

        {/* Financial Summary */}
        <Card className="p-4 space-y-2 bg-gray-50/50">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900">৳{invoice.subtotal_amount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discount Total:</span>
              <span className="font-semibold text-gray-900">-৳{invoice.discount_amount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax Total:</span>
              <span className="font-semibold text-gray-900">৳{invoice.tax_amount}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
              <span>Grand Total:</span>
              <span className="text-primary-700">৳{invoice.grand_total}</span>
            </div>

            {/* Profitability Subledger */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  Allocated FIFO COGS:
                </span>
                <span className="font-mono font-semibold text-gray-800">
                  ৳{totalCogsNum.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Gross Commercial Profit:</span>
                <span
                  className={`font-mono font-bold ${
                    grossProfit >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  ৳{grossProfit.toFixed(2)} ({grossMarginPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" />
                Void Sales Invoice
              </h3>
              <button
                onClick={() => setShowVoidModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVoidInvoice} className="space-y-4">
              <p className="text-xs text-gray-600">
                Voiding this invoice will transition its status to VOID. This action cannot be
                undone.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Voiding *
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Billed in error, customer duplicate order..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVoidModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Void
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
