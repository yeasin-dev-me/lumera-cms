"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  StockAdjustment,
  StockAdjustmentReason,
  StockAdjustmentStatus,
  StockAdjustmentItemInput,
} from "@/types/inventory";
import { ProductDetail } from "@/types/catalog";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ClipboardCheck,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react";

export default function StockAdjustmentsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [searchNumber, setSearchNumber] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<ProductDetail[]>([]);
  const [creating, setCreating] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formReason, setFormReason] = useState<StockAdjustmentReason>("physical_count");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formItems, setFormItems] = useState<
    Array<{
      product_id: number;
      batch_lot_id: number | null;
      counted_quantity: number;
      unit_cost: string;
      notes: string;
    }>
  >([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getStockAdjustments({
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
        adjustment_number: searchNumber || undefined,
        page,
        page_size: pageSize,
      });

      setAdjustments(res.results || []);
      setTotalCount(res.count);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load stock adjustments.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reasonFilter, searchNumber, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadProducts = async () => {
    try {
      const res = await adminApi.getProducts({ page_size: 100 });
      setProductsList(res.results || []);
    } catch {
      // ignore
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setModalError(null);
    setFormReason("physical_count");
    setFormNotes("");
    setFormItems([]);
    loadProducts();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleAddItem = () => {
    if (productsList.length === 0) return;
    setFormItems((prev) => [
      ...prev,
      {
        product_id: productsList[0].id,
        batch_lot_id: null,
        counted_quantity: productsList[0].stock_quantity || 0,
        unit_cost: "",
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number | null
  ) => {
    setFormItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      setModalError("Please add at least one line item to the adjustment.");
      return;
    }

    try {
      setCreating(true);
      setModalError(null);

      const itemsPayload: StockAdjustmentItemInput[] = formItems.map((it) => ({
        product_id: it.product_id,
        batch_lot_id: it.batch_lot_id || null,
        counted_quantity: Number(it.counted_quantity),
        unit_cost: it.unit_cost ? it.unit_cost : null,
        notes: it.notes,
      }));

      const created = await adminApi.createStockAdjustment({
        reason: formReason,
        notes: formNotes,
        items: itemsPayload,
      });

      handleCloseModal();
      router.push(`/inventory/adjustments/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setModalError(err.message || "Failed to create adjustment.");
      } else {
        setModalError("An unexpected error occurred.");
      }
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: StockAdjustmentStatus) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="muted" className="text-xs">
            Draft
          </Badge>
        );
      case "submitted":
        return (
          <Badge variant="warning" className="text-xs inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Submitted
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="success" className="text-xs inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="danger" className="text-xs inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="muted" className="text-xs text-lumera-text-muted">
            Cancelled
          </Badge>
        );
    }
  };

  const canAdjust = hasPermission("inventory.adjust");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lumera-text flex items-center gap-2.5">
            <ClipboardCheck className="h-7 w-7 text-brand" />
            Stock Adjustments
          </h1>
          <p className="text-sm text-lumera-text-muted mt-1">
            Audit count vouchers, physical variances, damages, and dual-control approval workflows.
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
            <Button size="sm" onClick={handleOpenModal} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              New Adjustment
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Filter Tabs & Search */}
      <Card className="p-4 bg-surface border-border space-y-3">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: "", label: "All Statuses" },
            { id: "draft", label: "Draft" },
            { id: "submitted", label: "Submitted (Pending)" },
            { id: "approved", label: "Approved (Posted)" },
            { id: "rejected", label: "Rejected" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-surface-muted text-lumera-text-muted hover:text-lumera-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-lumera-text-muted" />
            <input
              type="text"
              placeholder="Search by adjustment voucher number (e.g. ADJ-2026-00001)..."
              value={searchNumber}
              onChange={(e) => {
                setSearchNumber(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text font-mono focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter adjustments by reason"
              className="w-full px-2.5 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">All Adjustment Reasons</option>
              <option value="physical_count">Physical Count</option>
              <option value="damage">Damage</option>
              <option value="spoilage">Spoilage</option>
              <option value="expiry">Expiry</option>
              <option value="theft">Theft</option>
              <option value="data_correction">Data Correction</option>
              <option value="opening_balance">Opening Balance</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Adjustments Table */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 border-b border-border text-xs uppercase tracking-wider text-lumera-text-muted">
              <tr>
                <th className="px-5 py-3.5 font-medium">Voucher #</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Reason</th>
                <th className="px-5 py-3.5 font-medium text-right">Items</th>
                <th className="px-5 py-3.5 font-medium text-right">Total Variance</th>
                <th className="px-5 py-3.5 font-medium">Created By</th>
                <th className="px-5 py-3.5 font-medium">Approved By</th>
                <th className="px-5 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-lumera-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand" />
                    Loading adjustments...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-lumera-text-muted">
                    No stock adjustments found matching criteria.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-xs text-lumera-text">
                      <Link
                        href={`/inventory/adjustments/${adj.id}`}
                        className="text-brand hover:underline inline-flex items-center gap-1"
                      >
                        {adj.adjustment_number}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>

                    <td className="px-5 py-3.5">{getStatusBadge(adj.status)}</td>

                    <td className="px-5 py-3.5 text-xs capitalize text-lumera-text">
                      {adj.reason.replace(/_/g, " ")}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-lumera-text">
                      {adj.items_count}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-xs">
                      {adj.total_variance_quantity > 0 ? (
                        <span className="text-emerald-600">+{adj.total_variance_quantity}</span>
                      ) : adj.total_variance_quantity < 0 ? (
                        <span className="text-rose-600">{adj.total_variance_quantity}</span>
                      ) : (
                        <span className="text-lumera-text-muted">0</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-lumera-text-muted">
                      <div>{adj.created_by_email || "System"}</div>
                      <div className="text-[10px]">
                        {new Date(adj.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-lumera-text-muted">
                      {adj.approved_by_email ? (
                        <div>
                          <div className="text-emerald-600 font-medium">{adj.approved_by_email}</div>
                          <div className="text-[10px]">
                            {adj.approved_at ? new Date(adj.approved_at).toLocaleDateString() : ""}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/inventory/adjustments/${adj.id}`}
                        className="text-xs text-brand hover:underline inline-flex items-center gap-1"
                      >
                        Details &rarr;
                      </Link>
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
              {Math.min(page * pageSize, totalCount)} of {totalCount} adjustments
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

      {/* Create Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-lumera-text flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-brand" />
                Create Stock Adjustment Voucher
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-lumera-text-muted hover:text-lumera-text p-1 rounded-md"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <Alert variant="danger">
                {modalError}
              </Alert>
            )}

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-lumera-text block mb-1">
                    Adjustment Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value as StockAdjustmentReason)}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="physical_count">Physical Count</option>
                    <option value="damage">Damage Write-off</option>
                    <option value="spoilage">Spoilage</option>
                    <option value="expiry">Expired Stock</option>
                    <option value="theft">Theft / Shrinkage</option>
                    <option value="data_correction">Data Correction</option>
                    <option value="opening_balance">Opening Balance Initialization</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-lumera-text block mb-1">
                    Voucher Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Audit reason, warehouse location, ticket reference..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Line items section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-lumera-text-muted">
                    Adjustment Line Items ({formItems.length})
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Product
                  </Button>
                </div>

                {formItems.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-lumera-text-muted">
                    Click &ldquo;Add Product&rdquo; above to include items in this physical count adjustment.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-muted/60 border border-border rounded-lg grid grid-cols-12 gap-2.5 items-center"
                      >
                        <div className="col-span-12 sm:col-span-5">
                          <label className="text-[10px] text-lumera-text-muted block mb-0.5">
                            Product
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) =>
                              handleItemChange(idx, "product_id", Number(e.target.value))
                            }
                            aria-label={`Select product for line item ${idx + 1}`}
                            className="w-full px-2 py-1.5 bg-surface border border-border rounded text-xs text-lumera-text focus:outline-none"
                          >
                            {productsList.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) [Curr: {p.stock_quantity}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label className="text-[10px] text-lumera-text-muted block mb-0.5">
                            Counted Physical Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.counted_quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "counted_quantity", Number(e.target.value))
                            }
                            aria-label={`Counted physical quantity for line item ${idx + 1}`}
                            className="w-full px-2 py-1.5 bg-surface border border-border rounded text-xs text-lumera-text font-mono focus:outline-none"
                          />
                        </div>

                        <div className="col-span-5 sm:col-span-3">
                          <label className="text-[10px] text-lumera-text-muted block mb-0.5">
                            Unit Cost (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 50.00"
                            value={item.unit_cost}
                            onChange={(e) => handleItemChange(idx, "unit_cost", e.target.value)}
                            aria-label={`Unit cost for line item ${idx + 1}`}
                            className="w-full px-2 py-1.5 bg-surface border border-border rounded text-xs text-lumera-text font-mono focus:outline-none"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as Draft Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
