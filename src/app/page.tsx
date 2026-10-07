"use client";

import React, { useEffect, useState } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Can } from "@/lib/auth/permissions";
import {
  ShoppingBag,
  Clock,
  AlertTriangle,
  DollarSign,
  Server,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  FileText,
} from "lucide-react";

export default function CMSDashboardPage() {
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<import("@/types/orders").AdminOrderReport | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getHealth();
      setHealthStatus(res.status);
      try {
        setReport(await adminApi.getOrderReport());
      } catch {
        // Health remains useful when reporting permission is not assigned.
        setReport(null);
      }
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(`API connection error (${err.code}): ${err.message}`);
      } else {
        setError("Unable to connect to the backend server.");
      }
      setHealthStatus("unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-lumera-text">
              Operations Dashboard
            </h1>
            <Badge variant="primary">TASK-002 Active</Badge>
          </div>
          <p className="text-xs text-lumera-text-muted">
            Lumera operational control center. Headless Django API backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={loading}
            onClick={checkHealth}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Verify API Connection</span>
          </Button>
        </div>
      </div>

      {/* Backend Integration Diagnostics Alert if error */}
      {error && (
        <Alert variant="warning" title="Backend Integration Notice">
          {error}
          <div className="mt-1 text-[11px] opacity-80">
            Ensure the Django backend is running at <code>http://localhost:8000</code> or via Docker Compose.
          </div>
        </Alert>
      )}

      {/* Operational Metric Cards (Foundation Shell) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-lumera-text-muted block">
              Total Orders
            </span>
            <span className="text-2xl font-bold text-lumera-text">{report?.orders_count ?? "—"}</span>
            <span className="text-[10px] text-lumera-text-muted block mt-1">
              Awaiting first customer orders
            </span>
          </div>
          <div className="p-3 rounded-md bg-lumera-primary/10 text-lumera-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-lumera-text-muted block">
              Pending Fulfillment
            </span>
            <span className="text-2xl font-bold text-lumera-text">{report ? report.orders_count - report.paid_orders_count : "—"}</span>
            <span className="text-[10px] text-lumera-text-muted block mt-1">
              Fulfillment queue empty
            </span>
          </div>
          <div className="p-3 rounded-md bg-lumera-warning/15 text-lumera-warning">
            <Clock className="h-5 w-5" />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-lumera-text-muted block">
              Low Stock Alerts
            </span>
            <span className="text-2xl font-bold text-lumera-text">0</span>
            <span className="text-[10px] text-lumera-text-muted block mt-1">
              Thresholds monitored server-side
            </span>
          </div>
          <div className="p-3 rounded-md bg-lumera-accent/15 text-lumera-accent">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-lumera-text-muted block">
              Verified Revenue
            </span>
            <span className="text-2xl font-bold text-lumera-text">
              {report ? `${report.currency} ${report.gross_sales}` : "—"}
            </span>
            <span className="text-[10px] text-lumera-text-muted block mt-1">
              Calculated via backend services
            </span>
          </div>
          <div className="p-3 rounded-md bg-lumera-success/15 text-lumera-success">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Integration & Permission Verification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-lumera-primary" />
              <h3 className="font-semibold text-xs text-lumera-text">
                CMS ↔ Backend API Integration Status
              </h3>
            </div>
            <span className="font-mono text-xs text-lumera-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {healthStatus.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 text-xs text-lumera-text-muted">
            <p>
              The Custom Next.js CMS acts as the operational control center for Lumera.
              Per architectural governance (ADR-0007), Django Admin is explicitly excluded,
              and all operations are routed through the documented <code>/api/v1/admin/</code> API.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded border border-border bg-surface-muted">
                <span className="font-semibold text-lumera-text block text-[11px]">API Contract</span>
                <span>OpenAPI 3.1 (/api/v1/admin/)</span>
              </div>
              <div className="p-3 rounded border border-border bg-surface-muted">
                <span className="font-semibold text-lumera-text block text-[11px]">Authorization Model</span>
                <span>Granular Permission-Based RBAC</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Operational Navigation */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck className="h-4 w-4 text-lumera-primary" />
            <h3 className="font-semibold text-xs text-lumera-text">
              Operational Modules
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <Can permission="products.read">
              <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-lumera-text-muted" />
                  <span>Products Module</span>
                </div>
                <Badge variant="muted">TASK-004</Badge>
              </div>
            </Can>

            <Can permission="orders.read">
              <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-lumera-text-muted" />
                  <span>Orders Fulfillment</span>
                </div>
                <Badge variant="muted">TASK-006</Badge>
              </div>
            </Can>

            <Can permission="content.read">
              <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-lumera-text-muted" />
                  <span>Storefront Content</span>
                </div>
                <Badge variant="muted">TASK-005</Badge>
              </div>
            </Can>

            <Can permission="categories.read">
              <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-lumera-text-muted" />
                  <span>Categories</span>
                </div>
                <Badge variant="muted">TASK-004</Badge>
              </div>
            </Can>
          </div>
        </Card>
      </div>
    </div>
  );
}
