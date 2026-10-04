"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Category, CategoryInput } from "@/types/catalog";
import { Can, usePermissions } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";

export default function CategoriesPage() {
  const { hasPermission } = usePermissions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryInput>({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    status: "active",
    sort_order: 0,
    seo_title: "",
    seo_description: "",
  });
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Archive state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load categories.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      status: "active",
      sort_order: 0,
      seo_title: "",
      seo_description: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image_url: cat.image_url || "",
      status: cat.status,
      sort_order: cat.sort_order,
      seo_title: cat.seo_title || "",
      seo_description: cat.seo_description || "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug if creating
      slug: !editingCategory ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : prev.slug,
    }));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, formData);
      } else {
        await adminApi.createCategory(formData);
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setModalError(err.message);
      } else {
        setModalError("An unexpected error occurred while saving.");
      }
    } finally {
      setModalSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm("Are you sure you want to archive this category?")) return;

    setDeletingId(id);
    setError(null);
    try {
      await adminApi.deleteCategory(id);
      await loadCategories();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to archive category.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Category Operations</h1>
          <p className="text-xs text-lumera-text-muted mt-1">
            Authoritative category taxonomy for catalog organization & storefront navigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadCategories} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>

          <Can permission="categories.write">
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Category
            </Button>
          </Can>
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <Alert variant="danger" title="Category Management Alert">
          {error}
        </Alert>
      )}

      {/* Main Table Card */}
      <Card>
        {/* Search Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lumera-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or slug..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            />
          </div>

          <div className="text-xs text-lumera-text-muted font-mono">
            {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-lumera-text-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-lumera-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-lumera-primary mb-2" />
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-lumera-text-muted">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-lumera-cream flex items-center justify-center font-bold text-lumera-primary shrink-0">
                          {cat.name.charAt(0)}
                        </div>
                        <div>
                          <div>{cat.name}</div>
                          {cat.description && (
                            <div className="text-[11px] text-lumera-text-muted truncate max-w-xs">
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-lumera-text-muted">{cat.slug}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          cat.status === "active"
                            ? "success"
                            : cat.status === "draft"
                            ? "warning"
                            : "muted"
                        }
                      >
                        {cat.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">{cat.sort_order}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Can permission="categories.write">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1 rounded text-lumera-text-muted hover:text-lumera-primary hover:bg-muted transition-colors"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </Can>

                        <Can permission="categories.delete">
                          <button
                            onClick={() => handleArchive(cat.id)}
                            disabled={deletingId === cat.id}
                            className="p-1 rounded text-lumera-text-muted hover:text-lumera-danger hover:bg-muted transition-colors"
                            title="Archive Category"
                          >
                            {deletingId === cat.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-lumera-primary" />
                <span>{editingCategory ? "Edit Category" : "Create New Category"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-lumera-text-muted hover:text-foreground p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {modalError && (
                <Alert variant="danger" title="Validation Error">
                  {modalError}
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Cleansers"
                    className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="e.g. cleansers"
                    className="w-full text-xs font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description for storefront display..."
                  className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "active" | "draft" | "archived" })
                    }
                    className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={modalSaving}>
                  {editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
