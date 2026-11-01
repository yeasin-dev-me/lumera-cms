"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SalesInvoice, PaymentTerms, CreateWholesaleInvoiceInput } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  PlusCircle,
  Search,
  RefreshCw,
  Printer,
  Eye,
  Filter,
  Loader2,
  Calendar,
  X,
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [costingFilter, setCostingFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Wholesale Create Modal
  const [showWholesaleModal, setShowWholesaleModal] = useState<boolean>(false);
  const [wsCustomerName, setWsCustomerName] = useState<string>("");
  const [wsCustomerPhone, setWsCustomerPhone] = useState<string>("");
  const [wsCustomerEmail, setWsCustomerEmail] = useState<string>("");
  const [wsPaymentTerms, setWsPaymentTerms] = useState<PaymentTerms>("net_30");
  const [wsNotes, setWsNotes] = useState<string>("");
  const [wsLines, setWsLines] = useState<
    { productId: number; productName: string; quantity: number; unitPrice: string }[]
  >([{ productId: 0, productName: "", quantity: 10, unitPrice: "500.00" }]);
  const [wsSaving, setWsSaving] = useState<boolean>(false);

  // Products lookup for modal
  const [catalogProducts, setCatalogProducts] = useState<{ id: number; name: string; sku: string; price: string }[]>([]);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getSalesInvoices({
        q: search || undefined,
        channel: channelFilter || undefined,
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        costing_status: costingFilter || undefined,
        page,
        page_size: pageSize,
      });
      setInvoices(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load sales invoices.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, channelFilter, statusFilter, paymentFilter, costingFilter, page, pageSize]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Load products for wholesale form
  const loadCatalog = async () => {
    try {
      const res = await fetch("/api/v1/admin/products/?page_size=100", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalogProducts(
          (data.results || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load products for wholesale", err);
    }
  };

  const handleOpenWholesaleModal = () => {
    loadCatalog();
    setShowWholesaleModal(true);
  };

  const addWholesaleLine = () => {
    setWsLines((prev) => [...prev, { productId: 0, productName: "", quantity: 1, unitPrice: "0.00" }]);
  };

  const removeWholesaleLine = (index: number) => {
    setWsLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateWholesale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wsLines.some((l) => !l.productId || l.quantity <= 0)) {
      setError("All wholesale line items must have a valid selected product and positive quantity.");
      return;
    }

    setWsSaving(true);
    setError(null);

    try {
      const payload: CreateWholesaleInvoiceInput = {
        customer_name: wsCustomerName,
        customer_phone: wsCustomerPhone,
        customer_email: wsCustomerEmail,
        payment_terms: wsPaymentTerms,
        notes: wsNotes,
        items: wsLines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          unit_price: l.unitPrice,
        })),
      };

      const newInv = await adminApi.createWholesaleInvoice(payload);
      setShowWholesaleModal(false);
      setSuccessMsg(`Draft Wholesale Invoice ${newInv.invoice_number} created successfully.`);
      loadInvoices();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create wholesale invoice.");
      }
    } finally {
      setWsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary-600" />
            Sales & Billing Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative billing records across Online Storefront, POS Counter, and Wholesale channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadInvoices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenWholesaleModal}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Wholesale Invoice
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice #, customer..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Channel */}
          <div>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Channels</option>
              <option value="online">Online Storefront</option>
              <option value="pos">POS Counter</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / Due</option>
            </select>
          </div>

          {/* Costing Status */}
          <div>
            <select
              value={costingFilter}
              onChange={(e) => {
                setCostingFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Costing Statuses</option>
              <option value="fully_costed">Fully Costed (COGS)</option>
              <option value="partially_costed">Partially Costed</option>
              <option value="uncosted">Uncosted</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Costing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No sales invoices match the current filters.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      {inv.channel === "online" ? (
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                          Online
                        </span>
                      ) : inv.channel === "pos" ? (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          POS Counter
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                          Wholesale
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{inv.customer_name}</div>
                      {inv.customer_phone && (
                        <div className="text-xs text-gray-400">{inv.customer_phone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      ৳{inv.grand_total}
                    </td>

                    <td className="py-3 px-4">
                      {inv.status === "issued" ? (
                        <Badge variant="success">Issued</Badge>
                      ) : inv.status === "draft" ? (
                        <Badge variant="warning">Draft</Badge>
                      ) : inv.status === "void" ? (
                        <Badge variant="danger">Void</Badge>
                      ) : (
                        <Badge variant="muted">{inv.status}</Badge>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {inv.payment_status === "paid" ? (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          ● Paid
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          ○ Unpaid
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {inv.costing_status === "fully_costed" ? (
                        <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                          Costed
                        </span>
                      ) : inv.costing_status === "partially_costed" ? (
                        <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                          Partial
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          Uncosted
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/sales/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <a
                          href={adminApi.getSalesInvoicePdfUrl(inv.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-gray-600">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
          <span>Total {totalCount} records</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Wholesale Invoice Modal */}
      {showWholesaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary-600" />
                Draft Wholesale Commercial Invoice
              </h3>
              <button
                onClick={() => setShowWholesaleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWholesale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={wsCustomerName}
                    onChange={(e) => setWsCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    placeholder="e.g. Apex Superstore"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={wsCustomerPhone}
                    onChange={(e) => setWsCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    placeholder="017XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={wsPaymentTerms}
                    onChange={(e) => setWsPaymentTerms(e.target.value as PaymentTerms)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  >
                    <option value="net_15">Net 15 Days</option>
                    <option value="net_30">Net 30 Days</option>
                    <option value="net_60">Net 60 Days</option>
                    <option value="immediate">Due on Receipt</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase text-gray-600 tracking-wider">
                    Wholesale Order Lines
                  </h4>
                  <button
                    type="button"
                    onClick={addWholesaleLine}
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {wsLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200"
                    >
                      <div className="col-span-6">
                        <select
                          required
                          value={line.productId}
                          onChange={(e) => {
                            const pId = parseInt(e.target.value);
                            const p = catalogProducts.find((item) => item.id === pId);
                            setWsLines((prev) =>
                              prev.map((l, i) =>
                                i === idx
                                  ? {
                                      ...l,
                                      productId: pId,
                                      productName: p?.name || "",
                                      unitPrice: p ? String(p.price) : l.unitPrice,
                                    }
                                  : l
                              )
                            );
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                        >
                          <option value={0}>Select Product...</option>
                          {catalogProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value || "1");
                            setWsLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, quantity: q } : l))
                            );
                          }}
                          className="w-full px-2 py-1 border rounded text-xs text-center"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="col-span-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={line.unitPrice}
                            onChange={(e) => {
                              const pr = e.target.value;
                              setWsLines((prev) =>
                                prev.map((l, i) => (i === idx ? { ...l, unitPrice: pr } : l))
                              );
                            }}
                            className="w-full px-2 py-1 border rounded text-xs"
                            placeholder="Unit Price"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 text-center">
                        {wsLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWholesaleLine(idx)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contract / PO Notes
                </label>
                <textarea
                  rows={2}
                  value={wsNotes}
                  onChange={(e) => setWsNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  placeholder="Terms agreed, purchase order reference..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowWholesaleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={wsSaving}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                >
                  {wsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Wholesale Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
