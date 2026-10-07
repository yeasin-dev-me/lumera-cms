"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AdminReturnRequest } from "@/types/orders";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Can } from "@/lib/auth/permissions";

export default function ReturnsPage() {
  const [returns, setReturns] = useState<AdminReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<import("@/types/orders").AdminRefund[]>([]);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getReturns();
      setReturns(response.results || []);
      try {
        const refundResponse = await adminApi.getRefunds();
        setRefunds(refundResponse.results || []);
      } catch {
        setRefunds([]);
      }
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Unable to load return requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  const transition = async (item: AdminReturnRequest, action: "approve" | "reject" | "receive") => {
    try {
      const updated = await adminApi.transitionReturn(item.public_id, action);
      setReturns((current) => current.map((entry) => entry.public_id === updated.public_id ? updated : entry));
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Unable to update return request.");
    }
  };

  return (
    <Can permission="orders.read" fallback={<p className="text-xs text-rose-500">Access denied.</p>}>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-xl font-bold tracking-tight text-lumera-text">Return Requests</h1>
          <p className="text-xs text-lumera-text-muted mt-1">
            Review delivered-order return requests. Approval does not settle a gateway refund.
          </p>
        </div>
        {error && <Alert variant="danger" title="Returns notice">{error}</Alert>}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-lumera-text-muted">Loading return requests...</div>
          ) : returns.length === 0 ? (
            <div className="p-8 text-center text-xs text-lumera-text-muted">No return requests found.</div>
          ) : (
            <div className="divide-y divide-border">
              {returns.map((item) => (
                <div key={item.public_id} className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="text-xs text-lumera-text">
                    <div className="flex items-center gap-2 mb-1">
                      <strong>Order {item.order_public_id}</strong>
                      <Badge variant={item.status === "rejected" ? "danger" : item.status === "received" ? "success" : "accent"}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-lumera-text-muted">{item.reason}</p>
                    <p className="text-lumera-text-muted mt-1">
                      {item.items.map((entry) => `${entry.product_name} × ${entry.quantity}`).join(", ")}
                    </p>
                  </div>
                  <Can permission="orders.manage">
                    <div className="flex gap-2">
                      {item.status === "requested" && (
                        <>
                          <Button size="sm" onClick={() => transition(item, "approve")}>Approve</Button>
                          <Button size="sm" variant="secondary" onClick={() => transition(item, "reject")}>Reject</Button>
                        </>
                      )}
                      {item.status === "approved" && (
                        <Button size="sm" onClick={() => transition(item, "receive")}>Mark received</Button>
                      )}
                    </div>
                  </Can>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-lumera-text mb-3">Refund foundations</h2>
        <p className="text-xs text-lumera-text-muted mb-3">
          These are internal records only and do not confirm external gateway settlement.
        </p>
        {refunds.length === 0 ? (
          <p className="text-xs text-lumera-text-muted">No refund records available.</p>
        ) : (
          <div className="space-y-2">
            {refunds.map((refund) => (
              <div key={refund.public_id} className="flex items-center justify-between text-xs border-b border-border pb-2">
                <span className="text-lumera-text">{refund.order_public_id} · {refund.currency} {refund.amount}</span>
                <Badge variant={refund.status === "failed" ? "danger" : refund.status === "succeeded" ? "success" : "accent"}>
                  {refund.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Can>
  );
}
