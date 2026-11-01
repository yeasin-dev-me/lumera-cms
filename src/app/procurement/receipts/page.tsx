"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseReceipt } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Truck,
  PlusCircle,
  Search,
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle,
  Ban,
} from "lucide-react";

export default function GoodsReceiptsPage() {
  const { hasPermission } = usePermissions();

  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPurchaseReceipts({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setReceipts(res.results);
      setTotalCount(res.count);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load goods receipts.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Goods Receipts (GRN)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Warehouse delivery inspection notes, batch and expiry capture, and PO fulfillment subledger.
          </p>
        </div>
        {hasPermission("purchases.receive") && (
          <Link href="/procurement/receipts/new">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Goods Receipt
            </Button>
          </Link>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search GRN #, challan, PO #, supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadReceipts}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            Loading goods receipts...
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No goods receipts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">GRN Number</th>
                  <th className="px-4 py-3">PO Reference</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Receipt Date</th>
                  <th className="px-4 py-3">Delivery Challan</th>
                  <th className="px-4 py-3">Quantities</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.map((grn) => (
                  <tr key={grn.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {grn.receipt_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-medium">
                      <Link href={`/procurement/purchase-orders/${grn.purchase_order}`}>
                        {grn.po_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {grn.supplier_name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {grn.receipt_date}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {grn.delivery_note_ref || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">
                        {grn.total_accepted_quantity} accepted
                        {grn.total_rejected_quantity > 0 && (
                          <span className="text-rose-600 ml-1">
                            ({grn.total_rejected_quantity} rejected)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {grn.items_count} line {grn.items_count === 1 ? "item" : "items"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {grn.status === "received" ? (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                          Received
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <Ban className="h-3 w-3 mr-1 inline" />
                          Cancelled
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/procurement/receipts/${grn.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Inspect GRN
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalCount > pageSize && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} receipts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
