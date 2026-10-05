"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AdminOrderListItem, OrderStatus, PaymentStatus } from "@/types/orders";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Can } from "@/lib/auth/permissions";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrders({
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setOrders(res.results || []);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load operational orders.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return <Badge variant="success">Delivered</Badge>;
      case "shipped":
        return <Badge variant="primary">Shipped</Badge>;
      case "processing":
      case "confirmed":
        return <Badge variant="accent">{status}</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      case "pending":
      default:
        return <Badge variant="muted">Pending</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return (
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
            Paid
          </span>
        );
      case "refunded":
        return (
          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">
            Refunded
          </span>
        );
      case "failed":
        return (
          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-medium">
            Failed
          </span>
        );
      case "pending":
      default:
        return (
          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
            Pending
          </span>
        );
    }
  };

  return (
    <Can permission="orders.read" fallback={<p className="text-xs text-rose-500">Access denied.</p>}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-lumera-text">
                Order Management
              </h1>
              <Badge variant="primary">Step 6 Active</Badge>
            </div>
            <p className="text-xs text-lumera-text-muted">
              Live operational visibility into placed orders, price snapshots, and customer shipping details.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            isLoading={loading}
            onClick={fetchOrders}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>

        {error && (
          <Alert variant="danger" title="Orders Notice">
            {error}
          </Alert>
        )}

        {/* Filter Bar */}
        <Card className="p-4 bg-card border-border">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 text-lumera-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number or customer email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-border bg-background text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-border bg-background text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              >
                <option value="">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>

              <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                <Filter className="h-3 w-3" />
                <span>Apply</span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden border-border bg-card">
          {loading && orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-lumera-text-muted">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-10 w-10 bg-surface-muted rounded-full flex items-center justify-center mx-auto mb-3 text-lumera-text-muted">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-lumera-text mb-1">No Orders Found</h3>
              <p className="text-xs text-lumera-text-muted max-w-sm mx-auto">
                No orders match your filter criteria or no orders have been placed yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/40 text-lumera-text font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-lumera-text">
                  {orders.map((order) => (
                    <tr key={order.public_id} className="hover:bg-surface-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold">
                        #{order.order_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-[11px] text-lumera-text-muted">{order.customer_email}</div>
                      </td>
                      <td className="py-3 px-4 text-lumera-text-muted">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-4">{getPaymentBadge(order.payment_status)}</td>
                      <td className="py-3 px-4 font-mono">{order.item_count}</td>
                      <td className="py-3 px-4 font-mono font-semibold">${order.total}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/orders/${order.public_id}`}>
                          <Button variant="secondary" size="sm" className="gap-1 text-xs">
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Can>
  );
}
