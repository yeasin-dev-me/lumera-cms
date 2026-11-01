"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { GlobalInventoryMetrics, StockSummaryItem } from "@/types/inventory";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  Search,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function StockSummaryPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [metrics, setMetrics] = useState<GlobalInventoryMetrics | null>(null);
  const [items, setItems] = useState<StockSummaryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Loading & feedback states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getStockSummary({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });

      // API returns paginated response where results = { metrics, items }
      const payload = res.results as unknown as {
        metrics: GlobalInventoryMetrics;
        items: StockSummaryItem[];
      };
      if (payload && payload.metrics) {
        setMetrics(payload.metrics);
        setItems(payload.items || []);
        setTotalCount(res.count);
      } else {
        // Fallback if not wrapped in results
        const direct = res as unknown as { metrics: GlobalInventoryMetrics; items: StockSummaryItem[] };
        if (direct.metrics) {
          setMetrics(direct.metrics);
          setItems(direct.items || []);
        }
      }
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load inventory stock summary.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleCreateOpeningDraft = async () => {
    if (!confirm("This will scan legacy unledgered stock and create a draft Opening Stock adjustment. Proceed?")) {
      return;
    }
    try {
      setGeneratingDraft(true);
      setError(null);
      setActionSuccess(null);
      const draft = await adminApi.createOpeningStockDraft();
      setActionSuccess(
        `Draft adjustment ${draft.adjustment_number} created with ${draft.items?.length || 0} line items. Navigate to Adjustments to review and approve.`
      );
      loadData();
      router.push(`/inventory/adjustments/${draft.id}`);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create opening stock draft adjustment.");
      }
    } finally {
      setGeneratingDraft(false);
    }
  };

  const canAdjust = hasPermission("inventory.adjust");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lumera-text flex items-center gap-2.5">
            <Boxes className="h-7 w-7 text-brand" />
            Stock Summary & Subledger
          </h1>
          <p className="text-sm text-lumera-text-muted mt-1">
            Real-time stock reconciliation, append-only movement ledger verification, and expiry tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canAdjust && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCreateOpeningDraft}
              disabled={generatingDraft}
              className="flex items-center gap-1.5 border-brand/40 text-brand hover:bg-brand/5"
            >
              {generatingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Opening Stock Draft
            </Button>
          )}

          {canAdjust && (
            <Link href="/inventory/adjustments">
              <Button size="sm" className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                New Adjustment
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      {actionSuccess && (
        <Alert variant="success">
          {actionSuccess}
        </Alert>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted">
                Total Stock Units
              </span>
              <Boxes className="h-5 w-5 text-brand" />
            </div>
            <div className="mt-2 text-2xl font-bold text-lumera-text">
              {metrics.total_stock_units.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-lumera-text-muted">
              Across {metrics.total_products} catalog SKUs
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted">
                Reconciliation
              </span>
              {metrics.unreconciled_products === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="mt-2 text-2xl font-bold text-lumera-text">
              {metrics.reconciled_products} / {metrics.total_products}
            </div>
            <div className="mt-1 text-xs text-lumera-text-muted">
              {metrics.unreconciled_products > 0 ? (
                <span className="text-amber-500 font-medium">
                  {metrics.unreconciled_products} SKUs with ledger variance
                </span>
              ) : (
                <span className="text-emerald-500 font-medium">100% Fully Reconciled</span>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted">
                Stock Warnings
              </span>
              <Package className="h-5 w-5 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-lumera-text">
              {metrics.low_stock_products + metrics.out_of_stock_products}
            </div>
            <div className="mt-1 text-xs text-lumera-text-muted">
              <span className="text-rose-500 font-medium">{metrics.out_of_stock_products} out</span> &bull;{" "}
              <span className="text-amber-500 font-medium">{metrics.low_stock_products} low (&le;5)</span>
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-lumera-text-muted">
                Expiry Alerts
              </span>
              <CalendarClock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-lumera-text">
              {metrics.expired_batches + metrics.critical_batches}
            </div>
            <div className="mt-1 text-xs text-lumera-text-muted">
              <span className="text-rose-500 font-medium">{metrics.expired_batches} expired</span> &bull;{" "}
              <span className="text-amber-500 font-medium">{metrics.critical_batches} critical (&le;30d)</span>
            </div>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-surface border-border">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lumera-text-muted" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-border rounded-lg text-sm text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter products by inventory status"
              className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-sm text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">All Inventory Statuses</option>
              <option value="unreconciled">Unreconciled Only</option>
              <option value="low_stock">Low Stock (&le; 5 units)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
            </select>
          </div>

          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>
      </Card>

      {/* Stock Summary Table */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 border-b border-border text-xs uppercase tracking-wider text-lumera-text-muted">
              <tr>
                <th className="px-5 py-3.5 font-medium">Product & SKU</th>
                <th className="px-5 py-3.5 font-medium text-right">Cached Stock</th>
                <th className="px-5 py-3.5 font-medium text-right">Ledger Total</th>
                <th className="px-5 py-3.5 font-medium text-center">Subledger Reconciliation</th>
                <th className="px-5 py-3.5 font-medium text-right">FIFO Layers</th>
                <th className="px-5 py-3.5 font-medium text-center">Batch / Expiry Health</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-lumera-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand" />
                    Loading inventory positions and subledger balances...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-lumera-text-muted">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.product_id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-lumera-text">{item.product_name}</div>
                      <div className="font-mono text-xs text-lumera-text-muted mt-0.5">
                        SKU: {item.sku}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span
                        className={`font-mono font-medium ${
                          item.cached_stock_quantity <= 0
                            ? "text-rose-500"
                            : item.cached_stock_quantity <= 5
                            ? "text-amber-500"
                            : "text-lumera-text"
                        }`}
                      >
                        {item.cached_stock_quantity}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-mono text-lumera-text font-medium">
                        {item.ledger_total_quantity}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {item.is_reconciled ? (
                        <Badge variant="success" className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Reconciled
                        </Badge>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <Badge variant="warning" className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Diff: {item.discrepancy_quantity > 0 ? `+${item.discrepancy_quantity}` : item.discrepancy_quantity}
                          </Badge>
                          {item.has_legacy_discrepancy && (
                            <span className="text-[10px] text-amber-500 font-medium">Legacy Unledgered</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="font-mono text-xs text-lumera-text">
                        {item.cost_layer_quantity} units
                      </div>
                      {item.has_unverified_valuation && (
                        <span className="text-[10px] text-lumera-text-muted block">Unverified</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {item.batch_count === 0 ? (
                        <span className="text-xs text-lumera-text-muted">No batches</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {item.expired_batch_count > 0 && (
                            <Badge variant="danger" className="text-[10px]">
                              {item.expired_batch_count} Expired
                            </Badge>
                          )}
                          {item.critical_expiry_count > 0 && (
                            <Badge variant="warning" className="text-[10px]">
                              {item.critical_expiry_count} &le;30d
                            </Badge>
                          )}
                          {item.expired_batch_count === 0 && item.critical_expiry_count === 0 && (
                            <Badge variant="success" className="text-[10px]">
                              {item.batch_count} Active
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/inventory/movements?sku=${encodeURIComponent(item.sku)}`}
                          className="text-xs text-brand hover:underline inline-flex items-center gap-1"
                        >
                          Ledger
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > pageSize && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-lumera-text-muted">
            <div>
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} items
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page * pageSize >= totalCount || loading}
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
