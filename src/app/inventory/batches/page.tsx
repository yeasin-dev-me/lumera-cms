"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { BatchLot, ExpiryStatus } from "@/types/inventory";
import { ProductDetail } from "@/types/catalog";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CalendarClock,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function BatchesPage() {
  const { hasPermission } = usePermissions();

  const [batches, setBatches] = useState<BatchLot[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Filters
  const [searchBatch, setSearchBatch] = useState<string>("");
  const [skuFilter, setSkuFilter] = useState<string>("");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<string>("");

  // Loading & states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<ProductDetail[]>([]);
  const [savingBatch, setSavingBatch] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    product: number;
    batch_number: string;
    manufacture_date: string;
    expiry_date: string;
    notes: string;
  }>({
    product: 0,
    batch_number: "",
    manufacture_date: "",
    expiry_date: "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getBatchLots({
        batch_number: searchBatch || undefined,
        sku: skuFilter || undefined,
        expiry_status: expiryStatusFilter || undefined,
        page,
        page_size: pageSize,
      });

      setBatches(res.results || []);
      setTotalCount(res.count);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load batch lots.");
      }
    } finally {
      setLoading(false);
    }
  }, [searchBatch, skuFilter, expiryStatusFilter, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load products for create batch modal
  const loadProducts = async () => {
    try {
      const res = await adminApi.getProducts({ page_size: 100 });
      setProductsList(res.results || []);
      if (res.results && res.results.length > 0 && !form.product) {
        setForm((prev) => ({ ...prev, product: res.results[0].id }));
      }
    } catch {
      // Products list load failure
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setModalError(null);
    loadProducts();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    setForm({
      product: 0,
      batch_number: "",
      manufacture_date: "",
      expiry_date: "",
      notes: "",
    });
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product) {
      setModalError("Please select a product.");
      return;
    }
    if (!form.batch_number.trim()) {
      setModalError("Batch number is required.");
      return;
    }
    if (form.manufacture_date && form.expiry_date && form.expiry_date < form.manufacture_date) {
      setModalError("Expiry date cannot be earlier than manufacture date.");
      return;
    }

    try {
      setSavingBatch(true);
      setModalError(null);
      await adminApi.createBatchLot({
        product: form.product,
        batch_number: form.batch_number.trim(),
        manufacture_date: form.manufacture_date || null,
        expiry_date: form.expiry_date || null,
        notes: form.notes,
        is_active: true,
      });

      setSuccessMsg(`Batch ${form.batch_number} created successfully.`);
      handleCloseModal();
      loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setModalError(err.message || "Failed to create batch.");
      } else {
        setModalError("An unexpected error occurred.");
      }
    } finally {
      setSavingBatch(false);
    }
  };

  const getExpiryBadge = (status: ExpiryStatus, days: number | null) => {
    switch (status) {
      case "expired":
        return (
          <Badge variant="danger" className="text-xs">
            Expired {days !== null ? `(${Math.abs(days)}d ago)` : ""}
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="warning" className="text-xs">
            Critical ({days}d remaining)
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="warning" className="text-xs">
            Warning ({days}d remaining)
          </Badge>
        );
      case "fresh":
        return (
          <Badge variant="success" className="text-xs">
            Fresh ({days}d remaining)
          </Badge>
        );
      default:
        return (
          <Badge variant="muted" className="text-xs text-lumera-text-muted">
            No Expiry Set
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
            <CalendarClock className="h-7 w-7 text-brand" />
            Batch & Expiry Control
          </h1>
          <p className="text-sm text-lumera-text-muted mt-1">
            Track lot numbers, expiration timelines, shelf-life freshness, and batch traceability.
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
              New Batch / Lot
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success">
          {successMsg}
        </Alert>
      )}

      {/* Filter Tabs and Search Bar */}
      <Card className="p-4 bg-surface border-border space-y-3">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: "", label: "All Batches" },
            { id: "expired", label: "Expired" },
            { id: "critical", label: "Critical (≤ 30d)" },
            { id: "warning", label: "Warning (31–90d)" },
            { id: "fresh", label: "Fresh (> 90d)" },
            { id: "unknown", label: "No Expiry Date" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setExpiryStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                expiryStatusFilter === tab.id
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
              placeholder="Search by batch number..."
              value={searchBatch}
              onChange={(e) => {
                setSearchBatch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-lumera-text-muted" />
            <input
              type="text"
              placeholder="Filter by product SKU..."
              value={skuFilter}
              onChange={(e) => {
                setSkuFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text font-mono focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </Card>

      {/* Batches Table */}
      <Card className="bg-surface border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60 border-b border-border text-xs uppercase tracking-wider text-lumera-text-muted">
              <tr>
                <th className="px-5 py-3.5 font-medium">Batch Number</th>
                <th className="px-5 py-3.5 font-medium">Product & SKU</th>
                <th className="px-5 py-3.5 font-medium">Manufacture Date</th>
                <th className="px-5 py-3.5 font-medium">Expiry Date</th>
                <th className="px-5 py-3.5 font-medium text-center">Freshness / Shelf Life</th>
                <th className="px-5 py-3.5 font-medium text-center">Status</th>
                <th className="px-5 py-3.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-lumera-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand" />
                    Loading batch records...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-lumera-text-muted">
                    No batch records found matching criteria.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-xs text-lumera-text">
                      {batch.batch_number}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-xs text-lumera-text">{batch.product_name}</div>
                      <div className="font-mono text-[11px] text-lumera-text-muted">{batch.product_sku}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-lumera-text">
                      {batch.manufacture_date || "—"}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-lumera-text">
                      {batch.expiry_date || "—"}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {getExpiryBadge(batch.expiry_status, batch.days_until_expiry)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {batch.is_active ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="muted" className="text-[10px] text-lumera-text-muted">Inactive</Badge>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-lumera-text-muted max-w-xs truncate">
                      {batch.notes || "—"}
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
              {Math.min(page * pageSize, totalCount)} of {totalCount} batches
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

      {/* Create Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-lumera-text flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-brand" />
                Register New Batch / Lot
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

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-lumera-text block mb-1">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value={0} disabled>
                    Select Product...
                  </option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-lumera-text block mb-1">
                  Batch Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-001"
                  value={form.batch_number}
                  onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="text-[10px] text-lumera-text-muted mt-0.5 block">
                  Must be unique for this product.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-lumera-text block mb-1">
                    Manufacture Date
                  </label>
                  <input
                    type="date"
                    value={form.manufacture_date}
                    onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-lumera-text block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-lumera-text block mb-1">
                  Notes / Supplier Reference
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional batch inspection details or lot notes..."
                  className="w-full px-3 py-2 bg-surface-muted border border-border rounded-lg text-xs text-lumera-text focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingBatch}>
                  {savingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Batch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
