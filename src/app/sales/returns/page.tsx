"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SalesReturn, SalesInvoice, CreateSalesReturnInput } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  RotateCcw,
  PlusCircle,
  Search,
  RefreshCw,
  Eye,
  Loader2,
  X,
  FileCheck,
} from "lucide-react";

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Return Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [targetInvoiceNumber, setTargetInvoiceNumber] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [lookingUpInvoice, setLookingUpInvoice] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>("customer_return");
  const [returnLines, setReturnLines] = useState<
    { itemId: number; productName: string; sku: string; billedQty: number; returnQty: number }[]
  >([]);
  const [creatingReturn, setCreatingReturn] = useState<boolean>(false);

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getSalesReturns({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setReturns(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load sales returns.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

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
        setReturnLines(
          (found.items || []).map((it) => ({
            itemId: it.id,
            productName: it.product_name,
            sku: it.product_sku,
            billedQty: it.quantity,
            returnQty: 1,
          }))
        );
      } else {
        setError(`Invoice '${targetInvoiceNumber}' not found or not eligible for return.`);
      }
    } catch (err) {
      setError("Failed to lookup invoice.");
    } finally {
      setLookingUpInvoice(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const validLines = returnLines.filter((l) => l.returnQty > 0);
    if (validLines.length === 0) {
      setError("Please specify at least one item with a return quantity > 0.");
      return;
    }

    setCreatingReturn(true);
    setError(null);

    try {
      const payload: CreateSalesReturnInput = {
        invoice_id: selectedInvoice.id,
        reason: returnReason,
        items: validLines.map((l) => ({
          invoice_item_id: l.itemId,
          return_quantity: l.returnQty,
        })),
      };

      const newReturn = await adminApi.createSalesReturn(payload);
      setShowCreateModal(false);
      setSelectedInvoice(null);
      setTargetInvoiceNumber("");
      setSuccessMsg(`Sales Return ${newReturn.return_number} drafted successfully.`);
      loadReturns();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create sales return.");
      }
    } finally {
      setCreatingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary-600" />
            Customer Sales Returns & Inspection
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dock receiving inspection, quality assessment, and selective restocking of resellable goods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadReturns} disabled={loading}>
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
            Initiate Sales Return
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
              placeholder="Search return # or invoice #..."
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
              <option value="received">Dock Received</option>
              <option value="inspected">Inspected</option>
              <option value="completed">Completed & Restocked</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Returns Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Items Returned</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading returns...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No sales returns found.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      <Link
                        href={`/sales/returns/${ret.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {ret.return_number}
                      </Link>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-700">{ret.invoice_number}</td>

                    <td className="py-3 px-4">
                      {ret.status === "completed" ? (
                        <Badge variant="success">Completed</Badge>
                      ) : ret.status === "inspected" ? (
                        <Badge variant="accent">Inspected</Badge>
                      ) : ret.status === "draft" ? (
                        <Badge variant="warning">Draft</Badge>
                      ) : (
                        <Badge variant="muted">{ret.status}</Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-600 capitalize">
                      {ret.reason.replace("_", " ")}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {(ret.items || []).reduce((sum, it) => sum + it.return_quantity, 0)} units
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(ret.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link href={`/sales/returns/${ret.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Inspect / Details
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

      {/* Create Sales Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary-600" />
                Initiate Sales Return
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
                  Enter the original issued Sales Invoice number to pull customer lines and pricing.
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
              <form onSubmit={handleCreateReturn} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                  <p className="font-bold text-gray-900">{selectedInvoice.invoice_number}</p>
                  <p className="text-gray-600">Customer: {selectedInvoice.customer_name}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Return Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  >
                    <option value="customer_return">Customer Return</option>
                    <option value="damaged_in_transit">Damaged in Transit</option>
                    <option value="wrong_item">Wrong Item Sent</option>
                    <option value="expired">Near / Past Expiry</option>
                    <option value="other">Other Reason</option>
                  </select>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <h4 className="text-xs font-bold uppercase text-gray-600">Select Return Lines</h4>
                  {returnLines.map((line, idx) => (
                    <div
                      key={line.itemId}
                      className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 block">{line.productName}</span>
                        <span className="font-mono text-gray-400">
                          {line.sku} • Billed: {line.billedQty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 w-28">
                        <label className="text-[10px] text-gray-500">Return:</label>
                        <input
                          type="number"
                          min="0"
                          max={line.billedQty}
                          value={line.returnQty}
                          onChange={(e) => {
                            const q = parseInt(e.target.value || "0");
                            setReturnLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, returnQty: q } : l))
                            );
                          }}
                          className="w-16 px-1.5 py-0.5 border rounded text-center text-xs font-bold"
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
                  <Button type="submit" disabled={creatingReturn} className="bg-primary-600 text-white">
                    {creatingReturn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Draft Return
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
