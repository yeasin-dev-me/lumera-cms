"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Supplier, SupplierInput } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Building2,
  ArrowLeft,
  Save,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { hasPermission } = usePermissions();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [deactivating, setDeactivating] = useState<boolean>(false);
  const [editData, setEditData] = useState<SupplierInput>({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
    payment_terms_days: 0,
    is_active: true,
  });

  const loadSupplier = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSupplier(id);
      setSupplier(data);
      setEditData({
        name: data.name,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        tax_id: data.tax_id,
        payment_terms_days: data.payment_terms_days,
        is_active: data.is_active,
      });
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load supplier details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await adminApi.updateSupplier(id, editData);
      setSupplier(updated);
      setSuccessMsg("Supplier updated successfully.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to update supplier.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this supplier? Inactive suppliers cannot receive new purchase orders or bills.")) {
      return;
    }
    if (!id) return;
    try {
      setDeactivating(true);
      setError(null);
      const updated = await adminApi.deactivateSupplier(id);
      setSupplier(updated);
      setEditData((prev) => ({ ...prev, is_active: false }));
      setSuccessMsg("Supplier has been deactivated.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to deactivate supplier.");
      }
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading supplier record...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{error || "Supplier not found."}</Alert>
        <Link href="/procurement/suppliers">
          <Button variant="secondary">Back to Suppliers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/suppliers"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {supplier.name}
              </h1>
              {supplier.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="muted">Inactive</Badge>
              )}
            </div>
            <p className="text-sm font-mono text-gray-500 mt-0.5">Code: {supplier.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/procurement/suppliers/${supplier.id}/statement`}>
            <Button variant="secondary" size="sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Statement
            </Button>
          </Link>
          {supplier.is_active && hasPermission("suppliers.manage") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeactivate}
              disabled={deactivating}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {deactivating ? "Deactivating..." : "Deactivate Supplier"}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Grid: Details & Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Supplier Information & Terms
            </h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editData.contact_person || ""}
                    onChange={(e) => setEditData({ ...editData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tax / BIN Identifier
                  </label>
                  <input
                    type="text"
                    value={editData.tax_id || ""}
                    onChange={(e) => setEditData({ ...editData, tax_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editData.phone || ""}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editData.payment_terms_days}
                    onChange={(e) =>
                      setEditData({ ...editData, payment_terms_days: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editData.payment_terms_days === 0
                      ? "Immediate Payment / Cash on Delivery"
                      : `Net ${editData.payment_terms_days} days credit terms.`}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Physical Address
                  </label>
                  <textarea
                    rows={3}
                    value={editData.address || ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={!hasPermission("suppliers.manage")}
                  />
                </div>

                {hasPermission("suppliers.manage") && (
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editData.is_active}
                      onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Supplier is Active
                    </label>
                  </div>
                )}
              </div>

              {hasPermission("suppliers.manage") && (
                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" disabled={saving} className="flex items-center gap-1.5">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Right Column: Operational Stats & Architecture Notice */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Procurement History
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Purchase Orders
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {supplier.orders_count ?? 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Purchase Bills
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {supplier.bills_count ?? 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Created
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(supplier.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Architectural Notice Card */}
          <Card className="p-5 border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Operational Procurement Subsystem
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Accounts Payable financial ledgers, debit/credit aging, and supplier payments
                  are architecturally decoupled and will be activated in <strong>Step 06 (Accounts Payable)</strong> and <strong>Step 08 (Payments)</strong>.
                </p>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  In this phase, this record serves as the master vendor directory for Purchase Orders, Goods Receipts, and Landed Cost Invoicing.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
