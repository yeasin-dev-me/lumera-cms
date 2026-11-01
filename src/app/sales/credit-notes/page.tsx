"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CreditNote, SalesInvoice, CreateCreditNoteInput } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CreditCard,
  PlusCircle,
  Search,
  RefreshCw,
  Eye,
  Loader2,
  X,
  FileCheck,
} from "lucide-react";

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Credit Note Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [targetInvoiceNumber, setTargetInvoiceNumber] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [lookingUpInvoice, setLookingUpInvoice] = useState<boolean>(false);
  const [creditReason, setCreditReason] = useState<string>("Commercial billing adjustment");
  const [creditLines, setCreditLines] = useState<
    { itemId: number; productName: string; billedPrice: string; creditQty: number; unitPrice: string }[]
  >([]);
  const [creatingCreditNote, setCreatingCreditNote] = useState<boolean>(false);

  const loadCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getCreditNotes({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setCreditNotes(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load credit notes.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    loadCreditNotes();
  }, [loadCreditNotes]);

  const handleLookupInvoice = async () => {
    if (!targetInvoiceNumber.trim()) return;
    setLookingUpInvoice(true);
    setError(null);
    try {
      const res = await adminApi.getSalesInvoices({ q: targetInvoiceNumber.trim() });
      const found = (res.results || []).find(
        (inv) => inv.invoice_number.toLowerCase() === targetInvoiceNumber.trim().toLowerCase()
      );
      if (found) {
        setSelectedInvoice(found);
        setCreditLines(
          (found.items || []).map((it) => ({
            itemId: it.id,
            productName: it.product_name,
            billedPrice: it.unit_price,
            creditQty: 1,
            unitPrice: it.unit_price,
          }))
        );
      } else {
        setError(`Invoice '${targetInvoiceNumber}' not found or not eligible for credit adjustment.`);
      }
    } catch (err) {
      setError("Failed to lookup invoice.");
    } finally {
      setLookingUpInvoice(false);
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const validLines = creditLines.filter((l) => l.creditQty > 0 && parseFloat(l.unitPrice) > 0);
    if (validLines.length === 0) {
      setError("Please specify at least one item with valid quantity and price.");
      return;
    }

    setCreatingCreditNote(true);
    setError(null);

    try {
      const payload: CreateCreditNoteInput = {
        invoice_id: selectedInvoice.id,
        reason: creditReason,
        items: validLines.map((l) => ({
          invoice_item_id: l.itemId,
          quantity: l.creditQty,
          unit_price: l.unitPrice,
        })),
      };

      const newCN = await adminApi.createCreditNote(payload);
      setShowCreateModal(false);
      setSelectedInvoice(null);
      setTargetInvoiceNumber("");
      setSuccessMsg(`Draft Credit Note ${newCN.credit_note_number} created successfully.`);
      loadCreditNotes();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create credit note.");
      }
    } finally {
      setCreatingCreditNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary-600" />
            Credit Notes & Commercial Adjustments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Issue and track customer credits, post-sale price concessions, and return credits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadCreditNotes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedInvoice(null);
              setTargetInvoiceNumber("");
              setShowCreateModal(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Credit Note
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search credit note # or invoice #..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

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
              <option value="void">Void</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Credit Notes Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Credit Note #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading credit notes...
                  </td>
                </tr>
              ) : creditNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No credit notes found.
                  </td>
                </tr>
              ) : (
                creditNotes.map((cn) => (
                  <tr key={cn.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      <Link
                        href={`/sales/credit-notes/${cn.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {cn.credit_note_number}
                      </Link>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-700">{cn.invoice_number}</td>

                    <td className="py-3 px-4">
                      {cn.status === "issued" ? (
                        <Badge variant="success">Issued</Badge>
                      ) : cn.status === "draft" ? (
                        <Badge variant="warning">Draft</Badge>
                      ) : cn.status === "void" ? (
                        <Badge variant="danger">Void</Badge>
                      ) : (
                        <Badge variant="muted">{cn.status}</Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-600 line-clamp-1">{cn.reason}</td>

                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      ৳{cn.grand_total}
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(cn.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link href={`/sales/credit-notes/${cn.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Details
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

      {/* Create Credit Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Issue Commercial Credit Note
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedInvoice ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-600">
                  Enter the issued Sales Invoice number to pull customer lines and eligible credit balance.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetInvoiceNumber}
                    onChange={(e) => setTargetInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-202610-00001"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500"
                  />
                  <Button onClick={handleLookupInvoice} disabled={lookingUpInvoice}>
                    {lookingUpInvoice ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Lookup
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCreditNote} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">{selectedInvoice.invoice_number}</span>
                    <span className="text-emerald-700 font-semibold">
                      Max Creditable: ৳{selectedInvoice.remaining_creditable_amount || selectedInvoice.grand_total}
                    </span>
                  </div>
                  <p className="text-gray-600">Customer: {selectedInvoice.customer_name}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Credit Adjustment Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    placeholder="e.g. Billing correction, price adjustment..."
                  />
                </div>

                <div className="space-y-2 border-t pt-3">
                  <h4 className="text-xs font-bold uppercase text-gray-600">Line Adjustments</h4>
                  {creditLines.map((line, idx) => (
                    <div
                      key={line.itemId}
                      className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg text-xs border border-gray-200"
                    >
                      <div className="col-span-5">
                        <span className="font-semibold text-gray-900 block truncate">
                          {line.productName}
                        </span>
                        <span className="text-gray-500">Billed: ৳{line.billedPrice}</span>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-500 block">Credit Qty:</label>
                        <input
                          type="number"
                          min="0"
                          value={line.creditQty}
                          onChange={(e) => {
                            const q = parseInt(e.target.value || "0");
                            setCreditLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, creditQty: q } : l))
                            );
                          }}
                          className="w-full px-1.5 py-0.5 border rounded text-center text-xs font-bold"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className="text-[10px] text-gray-500 block">Unit Rate (৳):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => {
                            const pr = e.target.value;
                            setCreditLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, unitPrice: pr } : l))
                            );
                          }}
                          className="w-full px-1.5 py-0.5 border rounded text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={creatingCreditNote} className="bg-primary-600 text-white">
                    {creatingCreditNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Draft Credit Note
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
