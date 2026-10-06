"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AdminOrderDetail } from "@/types/orders";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Can } from "@/lib/auth/permissions";
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  Truck,
  User,
  Clock,
  History,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    setLoading(true);

    adminApi
      .getOrder(orderId)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (err instanceof AdminApiError) {
          setError(err.message);
        } else {
          setError("Failed to load operational order details.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl animate-pulse">
        <div className="h-6 bg-surface-muted rounded w-36" />
        <div className="h-64 bg-surface-muted rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Alert variant="danger" title="Error">
          {error || "Order not found."}
        </Alert>
        <div className="mt-4">
          <Link href="/orders">
            <Button variant="secondary" size="sm">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Can permission="orders.read" fallback={<p className="text-xs text-rose-500">Access denied.</p>}>
      <div className="space-y-6 max-w-5xl">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-lumera-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Orders List</span>
        </Link>

        {/* Top summary header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-lumera-text">
                Order #{order.order_number}
              </h1>
              <Badge variant="primary">{order.status}</Badge>
              <span className="text-xs bg-surface-muted px-2 py-0.5 rounded text-lumera-text">
                Payment: {order.payment_status}
              </span>
            </div>
            <p className="text-xs text-lumera-text-muted">
              UUID: <span className="font-mono">{order.public_id}</span> &bull; Placed at{" "}
              {new Date(order.created_at).toLocaleString("en-US")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column: Items & Totals */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-5 bg-card border-border">
              <h2 className="text-sm font-semibold text-lumera-text mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-lumera-primary" />
                <span>Line Items Snapshot ({order.items.length})</span>
              </h2>

              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded bg-surface-muted overflow-hidden shrink-0 border border-border/50">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lumera-text-muted">
                            <ShoppingBag className="w-4 h-4 opacity-40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-lumera-text truncate">
                          {item.product_name}
                        </p>
                        <p className="text-[11px] text-lumera-text-muted font-mono">
                          SKU: {item.product_sku} &bull; {item.quantity} &times; ${item.unit_price}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-lumera-text">
                      ${item.line_total}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-xs">
                <div className="flex justify-between text-lumera-text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono text-lumera-text">${order.subtotal}</span>
                </div>
                <div className="flex justify-between text-lumera-text-muted">
                  <span>Shipping Cost</span>
                  <span className="font-mono text-lumera-text">${order.shipping_cost}</span>
                </div>
                {order.discount_total !== "0.00" && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-${order.discount_total}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border flex justify-between font-semibold text-sm">
                  <span className="text-lumera-text">Total</span>
                  <span className="font-mono text-lumera-text">${order.total}</span>
                </div>
              </div>
            </Card>

            {/* Lifecycle Status History */}
            <Card className="p-5 bg-card border-border">
              <h2 className="text-sm font-semibold text-lumera-text mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-lumera-primary" />
                <span>Fulfillment Status History</span>
              </h2>
              <div className="space-y-3">
                {order.status_history.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <Clock className="h-3.5 w-3.5 text-lumera-text-muted mt-0.5" />
                    <div>
                      <span className="font-medium text-lumera-text">
                        {hist.from_status ? `${hist.from_status} → ` : ""}
                        {hist.to_status}
                      </span>
                      {hist.reason && (
                        <p className="text-[11px] text-lumera-text-muted">{hist.reason}</p>
                      )}
                      <span className="text-[10px] text-lumera-text-muted block">
                        {new Date(hist.created_at).toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Operational Payment & Gateway Settlement Card */}
            <Card className="p-5 bg-card border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-semibold text-lumera-text flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-lumera-primary" />
                  <span>Payment Settlement</span>
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    order.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : order.payment_status === "failed"
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {order.payment_status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 text-xs border-b border-border">
                <div>
                  <span className="text-lumera-text-muted block text-[11px]">Authoritative Amount:</span>
                  <span className="font-mono font-semibold text-lumera-text">
                    ${order.total} {order.currency}
                  </span>
                </div>
                <div>
                  <span className="text-lumera-text-muted block text-[11px]">Payment Gateway:</span>
                  <span className="font-medium text-lumera-text uppercase">
                    {order.payment?.gateway || "SSLCOMMERZ"}
                  </span>
                </div>
                <div>
                  <span className="text-lumera-text-muted block text-[11px]">Payment Method:</span>
                  <span className="text-lumera-text">
                    {order.payment?.method || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-lumera-text-muted block text-[11px]">Provider Txn ID:</span>
                  <span className="font-mono text-lumera-text truncate block">
                    {order.payment?.provider_transaction_id || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-lumera-text-muted block text-[11px]">Provider Reference:</span>
                  <span className="font-mono text-lumera-text truncate block">
                    {order.payment?.provider_reference || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-lumera-text-muted block text-[11px]">Verified Paid At:</span>
                  <span className="text-lumera-text block">
                    {order.payment?.paid_at
                      ? new Date(order.payment.paid_at).toLocaleString("en-US")
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Payment Attempts History */}
              {order.payment_attempts && order.payment_attempts.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-xs font-semibold text-lumera-text mb-2">
                    Payment Gateway Attempts ({order.payment_attempts.length})
                  </h3>
                  <div className="space-y-2">
                    {order.payment_attempts.map((att) => (
                      <div
                        key={att.public_id}
                        className="p-2.5 rounded bg-surface-muted/50 border border-border/50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-lumera-text">
                            Attempt #{att.attempt_number} &bull; {att.gateway.toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              att.status === "successful"
                                ? "bg-emerald-100 text-emerald-800"
                                : att.status === "failed"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {att.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-lumera-text-muted">
                          <span className="font-mono">${att.amount} {att.currency}</span>
                          <span>{new Date(att.created_at).toLocaleString("en-US")}</span>
                        </div>
                        {att.provider_transaction_id && (
                          <p className="text-[10px] font-mono text-lumera-text-muted">
                            Txn: {att.provider_transaction_id}
                          </p>
                        )}
                        {att.error_message && (
                          <p className="text-[10px] text-rose-600 font-medium">
                            Error: {att.error_message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrity Warning */}
              <div className="mt-3 p-2 bg-amber-50/60 border border-amber-200/50 rounded text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Payment state is authoritative and verified server-to-server with the payment gateway. Manual overrides are restricted by system architecture (ADR-0014).
                </span>
              </div>
            </Card>
          </div>

          {/* Sidebar Column: Customer & Delivery Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 bg-card border-border">
              <h2 className="text-sm font-semibold text-lumera-text mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-lumera-primary" />
                <span>Customer Profile</span>
              </h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-lumera-text-muted block">Name</span>
                  <span className="font-medium text-lumera-text">{order.customer.full_name}</span>
                </div>
                <div>
                  <span className="text-lumera-text-muted block">Email</span>
                  <span className="text-lumera-text">{order.customer.email}</span>
                </div>
                {order.customer.phone && (
                  <div>
                    <span className="text-lumera-text-muted block">Phone</span>
                    <span className="text-lumera-text">{order.customer.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 bg-card border-border">
              <h2 className="text-sm font-semibold text-lumera-text mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-lumera-primary" />
                <span>Shipping Address Snapshot</span>
              </h2>
              <div className="text-xs text-lumera-text space-y-1">
                <p className="font-semibold">{order.shipping_address.full_name}</p>
                <p className="text-lumera-text-muted">{order.shipping_address.phone}</p>
                <p className="pt-1">{order.shipping_address.address}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.area ? `${order.shipping_address.area}, ` : ""}
                  {order.shipping_address.city}
                  {order.shipping_address.postal_code ? ` - ${order.shipping_address.postal_code}` : ""}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.customer_notes && (
                  <div className="mt-3 pt-2 border-t border-border text-lumera-text-muted italic">
                    Note: &ldquo;{order.customer_notes}&rdquo;
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Can>
  );
}
