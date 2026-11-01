"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseOrder, PurchaseOrderStatus } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
  PlusCircle,
  Search,
  RefreshCw,
  Loader2,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  Ban,
} from "lucide-react";

export default function PurchaseOrdersPage() {
  const { hasPermission } = usePermissions();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPurchaseOrders({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setOrders(res.results);
      setTotalCount(res.count);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load purchase orders.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="muted"><Clock className="h-3 w-3 mr-1 inline" />Draft</Badge>;
      case "confirmed":
        return <Badge variant="primary"><CheckCircle className="h-3 w-3 mr-1 inline" />Confirmed</Badge>;
      case "partially_received":
        return <Badge variant="warning"><Truck className="h-3 w-3 mr-1 inline" />Partially Received</Badge>;
      case "received":
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1 inline" />Fully Received</Badge>;
      case "cancelled":
        return <Badge variant="danger"><Ban className="h-3 w-3 mr-1 inline" />Cancelled</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative purchase vouchers, dual maker-checker approvals, and fulfillment tracking.
          </p>
        </div>
        {hasPermission("purchases.create") && (
          <Link href="/procurement/purchase-orders/new">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Purchase Order
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
                placeholder="Search PO number, supplier, notes..."
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
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Fully Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            Loading purchase orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No purchase orders found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quantities</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {po.po_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {po.order_date}
                      {po.expected_delivery_date && (
                        <div className="text-xs text-gray-400">
                          Due: {po.expected_delivery_date}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{po.supplier_name}</div>
                      <div className="text-xs font-mono text-gray-400">{po.supplier_code}</div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(po.status)}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">
                        {po.total_received_quantity} / {po.total_ordered_quantity} units
                      </div>
                      <div className="text-xs text-gray-400">
                        {po.items_count} line {po.items_count === 1 ? "item" : "items"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ৳{parseFloat(po.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/procurement/purchase-orders/${po.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        View Details
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
              {Math.min(page * pageSize, totalCount)} of {totalCount} orders
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
