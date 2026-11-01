"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { StockMovement, StockMovementType } from "@/types/inventory";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeftRight,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
} from "lucide-react";

function MovementLedgerContent() {
  const searchParams = useSearchParams();
  const initialSku = searchParams.get("sku") || "";

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [skuFilter, setSkuFilter] = useState<string>(initialSku);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getStockMovements({
        sku: skuFilter || undefined,
        movement_type: movementTypeFilter || undefined,
        source_type: sourceTypeFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        page_size: pageSize,
      });

      setMovements(res.results || []);
      setTotalCount(res.count);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load stock movements.");
      }
    } finally {
      setLoading(false);
    }
  }, [skuFilter, movementTypeFilter, sourceTypeFilter, startDate, endDate, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const resetFilters = () => {
    setSkuFilter("");
    setMovementTypeFilter("");
    setSourceTypeFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getMovementTypeBadge = (type: StockMovementType, delta: number) => {
    const isPositive = delta > 0;
    const label = type.replace(/_/g, " ");

    if (isPositive) {
      return (
        <Badge variant="success" className="capitalize text-[11px]">
          {label}
        </Badge>
      );
    } else {
      return (
        <Badge variant="danger" className="capitalize text-[11px]">
          {label}
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lumera-text flex items-center gap-2.5">
            <ArrowLeftRight className="h-7 w-7 text-brand" />
            Stock Movement Ledger
          </h1>
          <p className="text-sm text-lumera-text-muted mt-1">
            Authoritative, append-only chronological log of all physical inventory mutations.
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
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4 bg-surface border-border">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-lumera-text-muted block mb-1">
                Filter by SKU
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-lumera-text-muted" />
                <input
                  type="text"
                  placeholder="e.g. PM-BEV-001"
                  value={skuFilter}
                  onChange={(e) => setSkuFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-lumera-text-muted block mb-1">
                Movement Type
              </label>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">All Movement Types</option>
                <option value="opening_stock">Opening Stock</option>
                <option value="purchase_received">Purchase Received</option>
                <option value="sales_dispatch">Sales Dispatch</option>
                <option value="sales_return">Sales Return</option>
                <option value="purchase_return">Purchase Return</option>
                <option value="adjustment_in">Adjustment In (+)</option>
                <option value="adjustment_out">Adjustment Out (-)</option>
                <option value="damage">Damage (-)</option>
                <option value="expired">Expired (-)</option>
                <option value="scrap">Scrap (-)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-lumera-text-muted block mb-1">
                Source Type
              </label>
              <select
                value={sourceTypeFilter}
                onChange={(e) => setSourceTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">All Source Types</option>
                <option value="order">Online Order (checkout)</option>
                <option value="order_cancellation">Order Cancellation</option>
                <option value="adjustment">Stock Adjustment</option>
                <option value="purchase_bill">Purchase Bill</option>
                <option value="manual">Manual Entry</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-lumera-text-muted block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-lumera-text-muted block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button type="submit" size="sm" className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Apply Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Movement Ledger Table */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 border-b border-border text-xs uppercase tracking-wider text-lumera-text-muted">
              <tr>
                <th className="px-5 py-3.5 font-medium">Timestamp</th>
                <th className="px-5 py-3.5 font-medium">Product & SKU</th>
                <th className="px-5 py-3.5 font-medium">Movement Type</th>
                <th className="px-5 py-3.5 font-medium text-right">Delta Qty</th>
                <th className="px-5 py-3.5 font-medium text-right">Unit Cost</th>
                <th className="px-5 py-3.5 font-medium text-right">Total Cost</th>
                <th className="px-5 py-3.5 font-medium">Batch / Lot</th>
                <th className="px-5 py-3.5 font-medium">Source Document</th>
                <th className="px-5 py-3.5 font-medium">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-lumera-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand" />
                    Querying append-only stock ledger...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-lumera-text-muted">
                    No stock movements found matching filter criteria.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-lumera-text-muted whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-xs text-lumera-text">{m.product_name}</div>
                      <div className="font-mono text-[11px] text-lumera-text-muted">{m.product_sku}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      {getMovementTypeBadge(m.movement_type, m.quantity_delta)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-sm">
                      {m.quantity_delta > 0 ? (
                        <span className="text-emerald-600">+{m.quantity_delta}</span>
                      ) : (
                        <span className="text-rose-600">{m.quantity_delta}</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-lumera-text">
                      {m.unit_cost ? `৳${parseFloat(m.unit_cost).toFixed(2)}` : "—"}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-lumera-text">
                      {m.total_cost ? `৳${parseFloat(m.total_cost).toFixed(2)}` : "—"}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-lumera-text-muted">
                      {m.batch_number ? (
                        <Badge variant="muted" className="font-mono text-[10px]">
                          {m.batch_number}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-mono text-lumera-text">
                        {m.source_type}:{m.source_id}
                      </div>
                      {m.notes && (
                        <div className="text-[10px] text-lumera-text-muted truncate max-w-[150px]">
                          {m.notes}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-lumera-text-muted">
                      {m.created_by_email || "System"}
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
              {Math.min(page * pageSize, totalCount)} of {totalCount} movements
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

export default function StockMovementsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-lumera-text-muted">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand" />
          Loading movement ledger...
        </div>
      }
    >
      <MovementLedgerContent />
    </Suspense>
  );
}
