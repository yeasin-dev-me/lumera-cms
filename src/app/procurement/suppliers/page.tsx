"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Supplier, SupplierInput } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Building2,
  PlusCircle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";

export default function SuppliersPage() {
  const { hasPermission } = usePermissions();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierInput>({
    code: "",
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
    payment_terms_days: 30,
    is_active: true,
  });

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getSuppliers({
        q: search || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
        page,
        page_size: pageSize,
      });
      setSuppliers(res.results);
      setTotalCount(res.count);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load suppliers.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter, page, pageSize]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      await adminApi.createSupplier(formData);
      setSuccessMsg(`Supplier '${formData.name}' created successfully.`);
      setShowModal(false);
      setFormData({
        code: "",
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        tax_id: "",
        payment_terms_days: 30,
        is_active: true,
      });
      loadSuppliers();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create supplier.");
      }
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Supplier Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage vendor profiles, commercial terms, and purchasing operational history.
          </p>
        </div>
        {hasPermission("suppliers.manage") && (
          <Button
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, contact, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadSuppliers}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Supplier Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No suppliers found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Payment Terms</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {s.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      {s.tax_id && (
                        <div className="text-xs text-gray-400">Tax ID: {s.tax_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.contact_person && (
                        <div className="text-gray-800">{s.contact_person}</div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {s.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {s.phone}
                          </span>
                        )}
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {s.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">
                        {s.payment_terms_days > 0
                          ? `Net ${s.payment_terms_days} days`
                          : "Immediate / COD"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/procurement/suppliers/${s.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        View & Manage
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
              {Math.min(page * pageSize, totalCount)} of {totalCount} suppliers
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

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Add New Supplier
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              {formError && <Alert variant="danger">{formError}</Alert>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Agro Supplies Ltd."
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Code (Optional, auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SUP-ACME"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sales@vendor.com"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.payment_terms_days}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tax / BIN ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="e.g. BIN-123456"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full business address..."
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Supplier"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
