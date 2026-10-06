"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AdminOrderDetail, OrderStatus } from "@/types/orders";
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
  RotateCw,
  ExternalLink,
  Edit2,
  XCircle,
  Check,
} from "lucide-react";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Shipping Modal state
  const [showShipModal, setShowShipModal] = useState<boolean>(false);
  const [shipCourier, setShipCourier] = useState<string>("Steadfast");
  const [shipTrackingNumber, setShipTrackingNumber] = useState<string>("");
  const [shipTrackingUrl, setShipTrackingUrl] = useState<string>("");

  // Edit Fulfillment state
  const [isEditingFulfillment, setIsEditingFulfillment] = useState<boolean>(false);
  const [editCourier, setEditCourier] = useState<string>("");
  const [editTrackingNumber, setEditTrackingNumber] = useState<string>("");
  const [editTrackingUrl, setEditTrackingUrl] = useState<string>("");

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    setLoading(true);

    adminApi
      .getOrder(orderId)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
        setEditCourier(data.courier || "");
        setEditTrackingNumber(data.tracking_number || "");
        setEditTrackingUrl(data.tracking_url || "");
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

  const handleTransition = async (
    toStatus: OrderStatus,
    reason?: string,
    courier?: string,
    trackingNumber?: string,
    trackingUrl?: string
  ) => {
    if (!order) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await adminApi.transitionOrder(order.public_id, {
        to_status: toStatus,
        reason: reason || `Transitioned to ${toStatus} by staff`,
        courier,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      });
      setOrder(updated);
      setEditCourier(updated.courier || "");
      setEditTrackingNumber(updated.tracking_number || "");
      setEditTrackingUrl(updated.tracking_url || "");
      setShowShipModal(false);
      setActionSuccess(`Order status successfully transitioned to "${toStatus}".`);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to transition order status.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await adminApi.updateOrderFulfillment(order.public_id, {
        courier: editCourier,
        tracking_number: editTrackingNumber,
        tracking_url: editTrackingUrl,
      });
      setOrder(updated);
      setIsEditingFulfillment(false);
      setActionSuccess("Courier and tracking information updated.");
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to update fulfillment details.");
      }
    } finally {
      setActionLoading(false);
    }
  };

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

  const isPaid = order.payment_status === "paid";
  const isTerminal = order.status === "delivered" || order.status === "cancelled";

  return (
    <Can permission="orders.read" fallback={<p className="text-xs text-rose-500">Access denied.</p>}>
      <div className="space-y-6 max-w-5xl pb-12">
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
              <Badge variant={order.status === "cancelled" ? "danger" : "primary"}>
                {order.status}
              </Badge>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                Payment: {order.payment_status}
              </span>
            </div>
            <p className="text-xs text-lumera-text-muted">
              UUID: <span className="font-mono">{order.public_id}</span> &bull; Placed at{" "}
              {new Date(order.created_at).toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {actionError && (
          <Alert variant="danger" title="Operation Error">
            {actionError}
          </Alert>
        )}

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Operational Fulfillment Actions Control Bar */}
        <Can permission="orders.manage">
          <Card className="p-5 bg-card border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-lumera-text flex items-center gap-2">
                  <Package className="h-4 w-4 text-lumera-primary" />
                  <span>Fulfillment Operations Control Bar</span>
                </h2>
                <p className="text-xs text-lumera-text-muted mt-0.5">
                  Authoritative status transitions enforcing legal lifecycle rules (ADR-0015).
                </p>
              </div>

              {/* Contextual Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {order.status === "pending" && isPaid && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTransition("confirmed", "Order confirmed by staff")}
                    disabled={actionLoading}
                  >
                    Mark Confirmed
                  </Button>
                )}

                {order.status === "confirmed" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTransition("processing", "Warehouse picking started")}
                    disabled={actionLoading}
                  >
                    Start Processing
                  </Button>
                )}

                {order.status === "processing" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowShipModal(true)}
                    disabled={actionLoading}
                    className="gap-1.5"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    <span>Ship Order...</span>
                  </Button>
                )}

                {order.status === "shipped" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTransition("delivered", "Delivery confirmed by staff")}
                    disabled={actionLoading}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark Delivered</span>
                  </Button>
                )}

                {!isTerminal && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Cancel this order? This will restore stock without auto-refunding.")) {
                        handleTransition("cancelled", "Order cancelled by administrator");
                      }
                    }}
                    disabled={actionLoading}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Cancel Order
                  </Button>
                )}

                {isTerminal && (
                  <span className="text-xs text-lumera-text-muted font-medium italic">
                    Terminal State (No further lifecycle mutations permitted)
                  </span>
                )}
              </div>
            </div>
          </Card>
        </Can>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Courier & Tracking Card */}
            <Card className="p-5 bg-card border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-semibold text-lumera-text flex items-center gap-2">
                  <Truck className="h-4 w-4 text-lumera-primary" />
                  <span>Courier & Tracking Metadata</span>
                </h2>
                <Can permission="orders.manage">
                  {!isEditingFulfillment && !isTerminal && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingFulfillment(true)}
                      className="text-xs gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit Tracking</span>
                    </Button>
                  )}
                </Can>
              </div>

              {isEditingFulfillment ? (
                <form onSubmit={handleUpdateFulfillment} className="pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-lumera-text block mb-1">
                        Courier Name
                      </label>
                      <input
                        type="text"
                        value={editCourier}
                        onChange={(e) => setEditCourier(e.target.value)}
                        placeholder="e.g. Steadfast, Pathao, DHL"
                        className="w-full text-xs px-2.5 py-1.5 border border-border rounded bg-surface-elevated text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-lumera-text block mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={editTrackingNumber}
                        onChange={(e) => setEditTrackingNumber(e.target.value)}
                        placeholder="e.g. ST-12345678"
                        className="w-full text-xs px-2.5 py-1.5 border border-border rounded bg-surface-elevated text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-lumera-text block mb-1">
                      Tracking URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={editTrackingUrl}
                      onChange={(e) => setEditTrackingUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs px-2.5 py-1.5 border border-border rounded bg-surface-elevated text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                      Save Tracking
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingFulfillment(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="pt-3 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-lumera-text-muted block text-[11px]">Courier</span>
                      <span className="font-medium text-lumera-text text-sm">
                        {order.courier || "Not assigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-lumera-text-muted block text-[11px]">Tracking Number</span>
                      <span className="font-mono text-lumera-text text-sm">
                        {order.tracking_number || "Not assigned"}
                      </span>
                    </div>
                  </div>

                  {order.tracking_url && (
                    <div className="pt-1">
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-lumera-primary hover:underline"
                      >
                        <span>Open Courier Tracking Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-[11px] text-lumera-text-muted pt-2 border-t border-border">
                    {order.shipped_at && (
                      <span>Shipped: {new Date(order.shipped_at).toLocaleString("en-US")}</span>
                    )}
                    {order.delivered_at && (
                      <span className="text-emerald-700 font-medium">
                        Delivered: {new Date(order.delivered_at).toLocaleString("en-US")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Line Items Snapshot */}
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

            {/* Lifecycle Status History Audit Log */}
            <Card className="p-5 bg-card border-border">
              <h2 className="text-sm font-semibold text-lumera-text mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-lumera-primary" />
                <span>Authoritative Audit Status History</span>
              </h2>
              <div className="space-y-3">
                {order.status_history.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                    <Clock className="h-3.5 w-3.5 text-lumera-text-muted mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lumera-text">
                          {hist.from_status ? `${hist.from_status} → ` : ""}
                          <span className="capitalize">{hist.to_status}</span>
                        </span>
                        {hist.actor_type && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-muted text-lumera-text-muted">
                            {hist.actor_type}
                          </span>
                        )}
                      </div>
                      {hist.reason && (
                        <p className="text-[11px] text-lumera-text-muted mt-0.5">{hist.reason}</p>
                      )}
                      <span className="text-[10px] text-lumera-text-muted block mt-0.5 font-mono">
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
                <Badge variant={isPaid ? "primary" : "muted"}>
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>

              {order.payment ? (
                <div className="pt-3 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted/50 p-3 rounded-lg">
                    <div>
                      <span className="text-lumera-text-muted block text-[11px]">Gateway</span>
                      <span className="font-semibold text-lumera-text uppercase">
                        {order.payment.gateway}
                      </span>
                    </div>
                    <div>
                      <span className="text-lumera-text-muted block text-[11px]">Method</span>
                      <span className="font-medium text-lumera-text">
                        {order.payment.method || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-lumera-text-muted block text-[11px]">Amount</span>
                      <span className="font-mono font-semibold text-lumera-text">
                        ${order.payment.amount} {order.payment.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-lumera-text-muted block text-[11px]">Settled At</span>
                      <span className="text-lumera-text">
                        {order.payment.paid_at
                          ? new Date(order.payment.paid_at).toLocaleString("en-US")
                          : "Unsettled"}
                      </span>
                    </div>
                  </div>

                  {order.payment.provider_transaction_id && (
                    <div className="text-[11px] font-mono text-lumera-text-muted bg-surface-elevated p-2 rounded border border-border">
                      Gateway Txn ID: {order.payment.provider_transaction_id}
                    </div>
                  )}
                </div>
              ) : (
                <p className="pt-3 text-xs text-lumera-text-muted">
                  No payment record has been initiated for this order yet.
                </p>
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

        {/* Dispatch & Shipping Modal */}
        {showShipModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-semibold text-lumera-text flex items-center gap-2">
                  <Truck className="h-4 w-4 text-lumera-primary" />
                  <span>Dispatch & Ship Order</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  className="text-lumera-text-muted hover:text-lumera-text"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-lumera-text-muted">
                Assign courier tracking details before handing the parcel to the carrier.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-lumera-text block mb-1">
                    Courier Provider *
                  </label>
                  <input
                    type="text"
                    value={shipCourier}
                    onChange={(e) => setShipCourier(e.target.value)}
                    placeholder="e.g. Steadfast, Pathao, DHL, RedX"
                    className="w-full px-3 py-2 border border-border rounded bg-surface-elevated text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-lumera-text block mb-1">
                    Tracking Number / Consignment ID *
                  </label>
                  <input
                    type="text"
                    value={shipTrackingNumber}
                    onChange={(e) => setShipTrackingNumber(e.target.value)}
                    placeholder="e.g. ST-98765432"
                    className="w-full px-3 py-2 border border-border rounded bg-surface-elevated text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-lumera-text block mb-1">
                    Tracking URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={shipTrackingUrl}
                    onChange={(e) => setShipTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded bg-surface-elevated text-lumera-text focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowShipModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleTransition(
                      "shipped",
                      "Dispatched with courier",
                      shipCourier,
                      shipTrackingNumber,
                      shipTrackingUrl
                    )
                  }
                  disabled={actionLoading || !shipCourier.trim() || !shipTrackingNumber.trim()}
                >
                  {actionLoading ? "Confirming..." : "Confirm Shipment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Can>
  );
}
