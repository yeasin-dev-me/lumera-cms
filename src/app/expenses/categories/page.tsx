"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseCategory } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FolderTree,
  PlusCircle,
  RefreshCw,
  Edit2,
  Trash2,
  ArrowLeft,
  X,
  CheckCircle2,
} from "lucide-react";

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [modalForm, setModalForm] = useState({
    name: "",
    code: "",
    description: "",
    parent: "" as string | number,
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState<boolean>(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getExpenseCategories();
      setCategories(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load expense categories.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalForm({
      name: "",
      code: "",
      description: "",
      parent: "",
      sort_order: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setModalForm({
      name: cat.name,
      code: cat.code,
      description: cat.description || "",
      parent: cat.parent || "",
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        name: modalForm.name,
        code: modalForm.code,
        description: modalForm.description,
        parent: modalForm.parent ? Number(modalForm.parent) : null,
        sort_order: Number(modalForm.sort_order),
        is_active: modalForm.is_active,
      };

      if (editingCategory) {
        await adminApi.updateExpenseCategory(editingCategory.id, payload);
        setSuccessMsg(`Category ${modalForm.code} updated successfully.`);
      } else {
        await adminApi.createExpenseCategory(payload);
        setSuccessMsg(`Category ${modalForm.code} created successfully.`);
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to save category.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: ExpenseCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name} (${cat.code})"?`)) {
      return;
    }
    try {
      setError(null);
      await adminApi.deleteExpenseCategory(cat.id);
      setSuccessMsg(`Category ${cat.code} deleted.`);
      await loadCategories();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to delete category.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/expenses" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Expenses
            </Link>
            <span>/</span>
            <span>Taxonomy</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Operational classification codes for business overheads, operating costs, and administrative expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadCategories} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={openCreateModal} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Categories Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Code</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Category Name</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Parent Category</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Sort Order</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Vouchers</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No expense categories configured. Click &quot;New Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">{cat.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{cat.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {cat.parent_name ? (
                        <Badge variant="muted">{cat.parent_name}</Badge>
                      ) : (
                        <span className="text-gray-400">— (Root)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{cat.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="primary">{cat.voucher_count ?? 0}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cat.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCategory ? `Edit Category: ${editingCategory.code}` : "New Expense Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Stationery & Supplies"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OPEX-OFFICE"
                  value={modalForm.code}
                  onChange={(e) => setModalForm({ ...modalForm, code: e.target.value.toUpperCase() })}
                  className="w-full text-sm font-mono border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={modalForm.parent}
                  onChange={(e) => setModalForm({ ...modalForm, parent: e.target.value })}
                  className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— No Parent (Top-level Root Category) —</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of expenditures grouped under this code..."
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={modalForm.sort_order}
                    onChange={(e) => setModalForm({ ...modalForm, sort_order: Number(e.target.value) })}
                    className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={modalForm.is_active}
                      onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Active Category
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

