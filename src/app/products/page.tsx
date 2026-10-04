"use client";

import { useEffect, useState, useTransition } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Category, ProductDetail, ProductInput } from "@/types/catalog";
import { Can, usePermissions } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Search,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ProductsPage() {
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [formData, setFormData] = useState<ProductInput>({
    name: "",
    slug: "",
    sku: "",
    category_id: 0,
    price: "0.00",
    discount_price: null,
    stock_quantity: 0,
    status: "draft",
    is_visible: true,
    is_featured: false,
    sort_order: 0,
    description: "",
    seo_title: "",
    seo_description: "",
    images: [],
  });
  const [imageInput, setImageInput] = useState<string>("");
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cats, prodsData] = await Promise.all([
        adminApi.getCategories().catch(() => [] as Category[]),
        adminApi.getProducts({
          category_id: selectedCategory ? parseInt(selectedCategory) : undefined,
          status: selectedStatus || undefined,
          search: search || undefined,
        }),
      ]);

      setCategories(cats);
      setProducts(prodsData.results);
      setTotalCount(prodsData.count);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load products.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    const defaultCatId = categories.length > 0 ? categories[0].id : 0;
    setFormData({
      name: "",
      slug: "",
      sku: "",
      category_id: defaultCatId,
      price: "29.00",
      discount_price: null,
      stock_quantity: 25,
      status: "active",
      is_visible: true,
      is_featured: false,
      sort_order: 0,
      description: "",
      seo_title: "",
      seo_description: "",
      images: [],
    });
    setImageInput("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductDetail) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      category_id: p.category.id,
      price: p.price,
      discount_price: p.discount_price,
      stock_quantity: p.stock_quantity,
      status: p.status,
      is_visible: p.is_visible,
      is_featured: p.is_featured,
      sort_order: p.sort_order,
      description: p.description || "",
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      images: p.images || [],
    });
    setImageInput(p.primary_image || (p.images && p.images.length > 0 ? p.images[0].image_url : ""));
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingProduct ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : prev.slug,
      sku: !editingProduct && !prev.sku ? `LMR-${name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` : prev.sku,
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    const payload: ProductInput = {
      ...formData,
      price: parseFloat(formData.price).toFixed(2),
      discount_price: formData.discount_price ? parseFloat(formData.discount_price).toFixed(2) : null,
      stock_quantity: parseInt(String(formData.stock_quantity)) || 0,
      images: imageInput ? [{ image_url: imageInput, is_primary: true }] : [],
    };

    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setModalError(err.message);
      } else {
        setModalError("An unexpected error occurred while saving product.");
      }
    } finally {
      setModalSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm("Are you sure you want to archive this product?")) return;

    setDeletingId(id);
    setError(null);
    try {
      await adminApi.deleteProduct(id);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to archive product.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Product Operations</h1>
          <p className="text-xs text-lumera-text-muted mt-1">
            Authoritative catalog items, pricing rules, stock, and status management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>

          <Can permission="products.write">
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Product
            </Button>
          </Can>
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <Alert variant="danger" title="Product Management Alert">
          {error}
        </Alert>
      )}

      {/* Main Table Card */}
      <Card>
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lumera-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, or slug..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-lumera-primary"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <div className="text-xs text-lumera-text-muted font-mono whitespace-nowrap">
              {totalCount} {totalCount === 1 ? "product" : "products"}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-lumera-text-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-lumera-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-lumera-primary mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-lumera-text-muted">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    {/* Product & Image */}
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/60 border border-border shrink-0 flex items-center justify-center">
                          {p.primary_image ? (
                            <img
                              src={p.primary_image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-serif font-bold text-lumera-primary">
                              {p.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <span>{p.name}</span>
                            {p.is_featured && (
                              <span title="Featured">
                                <Sparkles className="w-3 h-3 text-lumera-accent" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-lumera-text-muted font-mono">{p.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-lumera-text-muted">{p.sku}</td>

                    <td className="px-4 py-3 text-foreground">{p.category?.name || "—"}</td>

                    <td className="px-4 py-3 font-mono font-medium">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-foreground">${p.effective_price}</span>
                        {p.discount_price && p.discount_price !== p.price && (
                          <span className="text-[10px] text-lumera-text-muted line-through">
                            ${p.price}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span
                        className={
                          p.stock_quantity > 10
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : p.stock_quantity > 0
                            ? "text-amber-600 dark:text-amber-400 font-semibold"
                            : "text-rose-600 dark:text-rose-400 font-semibold"
                        }
                      >
                        {p.stock_quantity}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.status === "active"
                            ? "success"
                            : p.status === "draft"
                            ? "warning"
                            : "muted"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {p.is_visible ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-lumera-text-muted text-[11px]">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Can permission="products.write">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 rounded text-lumera-text-muted hover:text-lumera-primary hover:bg-muted transition-colors"
                            title="Edit Product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </Can>

                        <Can permission="products.delete">
                          <button
                            onClick={() => handleArchive(p.id)}
                            disabled={deletingId === p.id}
                            className="p-1 rounded text-lumera-text-muted hover:text-lumera-danger hover:bg-muted transition-colors"
                            title="Archive Product"
                          >
                            {deletingId === p.id ? (
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

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95">
            <div className="sticky top-0 z-10 bg-card px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-lumera-primary" />
                <span>{editingProduct ? `Edit ${editingProduct.name}` : "Create New Product"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-lumera-text-muted hover:text-foreground p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {modalError && (
                <Alert variant="danger" title="Validation Error">
                  {modalError}
                </Alert>
              )}

              {/* Title & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Barrier Restore Serum"
                    className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. BRS-001"
                    className="w-full text-xs font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="e.g. barrier-restore-serum"
                    className="w-full text-xs font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  >
                    <option value="" disabled>Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Authoritative Price, Discount Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full text-xs font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Discount Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_price || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_price: e.target.value ? e.target.value : null })
                    }
                    placeholder="Optional (< price)"
                    className="w-full text-xs font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs font-mono rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                  />
                </div>
              </div>

              {/* Status & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.is_visible}
                      onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                      className="rounded border-border text-lumera-primary focus:ring-lumera-primary"
                    />
                    <span>Visible in Store</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-border text-lumera-primary focus:ring-lumera-primary"
                    />
                    <span>Featured</span>
                  </label>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Primary Image URL</label>
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Formula ingredients, skin benefits, application guide..."
                  className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-lumera-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={modalSaving}>
                  {editingProduct ? "Save Product Changes" : "Create & Publish Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
