"use client";

import { useEffect, useState, useTransition } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  NavigationItem,
  NavigationItemInput,
  NavigationSection,
  NavigationDestinationType,
  NavigationStatus,
} from "@/types/navigation";
import { Can, usePermissions } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  Compass,
  Plus,
  Pencil,
  Archive,
  CheckCircle,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  X,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Tag,
  Clock,
} from "lucide-react";

const initialForm: NavigationItemInput = {
  label: "",
  section: "curated",
  destination_type: "collection",
  destination_value: "",
  badge_text: "",
  description: "",
  is_highlighted: false,
  sort_order: 10,
  status: "published",
  start_at: null,
  end_at: null,
};

const DESTINATION_TYPE_LABELS: Record<NavigationDestinationType, string> = {
  category: "Product Category",
  origin: "Origin Filter",
  audience: "Audience Filter",
  collection: "Collection Filter",
  offers: "Special Offers",
  ordering: "Sort / Order",
  internal_path: "Internal Route",
};

const DESTINATION_HELPERS: Record<NavigationDestinationType, { placeholder: string; helper: string }> = {
  category: {
    placeholder: "e.g. produce, dairy-eggs, bakery, meat-seafood",
    helper: "Category slug matching storefront taxonomy (links to /products?category=<slug>)",
  },
  origin: {
    placeholder: "e.g. local, imported, organic, artisan",
    helper: "Origin key matching storefront origin attributes (links to /products?origin=<slug>)",
  },
  audience: {
    placeholder: "e.g. family, kids, students, office, pets",
    helper: "Audience key matching product intended audience (links to /products?audience=<slug>)",
  },
  collection: {
    placeholder: "e.g. quick-dinner, breakfast-club, snack-pantry, organic-wellness",
    helper: "Curated shopping collection slug (links to /products?collection=<slug>)",
  },
  offers: {
    placeholder: "true (or leave blank)",
    helper: "Filters active discounted catalog items (links to /products?offers=true)",
  },
  ordering: {
    placeholder: "e.g. price-asc, price-desc, newest, bestselling",
    helper: "Sort ordering key applied to catalog (links to /products?ordering=<key>)",
  },
  internal_path: {
    placeholder: "e.g. /collections/family-packages or /bundles",
    helper: "Internal safe route starting with / (no external or javascript URLs permitted)",
  },
};

export default function NavigationManagementPage() {
  const { hasPermission } = usePermissions();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [formData, setFormData] = useState<NavigationItemInput>(initialForm);
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Action transitions
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { section?: string; status?: string; destination_type?: string; search?: string } = {};
      if (sectionFilter !== "all") params.section = sectionFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (destinationFilter !== "all") params.destination_type = destinationFilter;
      if (search.trim()) params.search = search.trim();

      const data = await adminApi.getNavigationItems(params);
      setItems(data);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load storefront navigation items.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("content.read")) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFilter, statusFilter, destinationFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      section: item.section,
      destination_type: item.destination_type,
      destination_value: item.destination_value || "",
      badge_text: item.badge_text || "",
      description: item.description || "",
      is_highlighted: item.is_highlighted,
      sort_order: item.sort_order,
      status: item.status,
      start_at: item.start_at ? item.start_at.slice(0, 16) : null,
      end_at: item.end_at ? item.end_at.slice(0, 16) : null,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    // Form client-side validation
    if (!formData.label.trim()) {
      setModalError("Navigation label is required.");
      setModalSaving(false);
      return;
    }

    if (formData.destination_type === "internal_path") {
      const val = (formData.destination_value || "").trim();
      if (!val.startsWith("/")) {
        setModalError("Internal path destinations must start with a leading slash '/' (e.g. /collections/family-packages).");
        setModalSaving(false);
        return;
      }
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(val) || val.startsWith("//")) {
        setModalError("External protocols and scheme-relative URLs are not allowed.");
        setModalSaving(false);
        return;
      }
    }

    const payload: NavigationItemInput = {
      ...formData,
      label: formData.label.trim(),
      destination_value: (formData.destination_value || "").trim(),
      badge_text: (formData.badge_text || "").trim(),
      description: (formData.description || "").trim(),
      start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
      end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
    };

    try {
      if (editingItem) {
        await adminApi.updateNavigationItem(editingItem.public_id, payload);
        setSuccessMessage(`Updated navigation item "${payload.label}" successfully.`);
      } else {
        await adminApi.createNavigationItem(payload);
        setSuccessMessage(`Created navigation item "${payload.label}" successfully.`);
      }
      setIsModalOpen(false);
      loadItems();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setModalError(err.message);
      } else {
        setModalError("Unable to save navigation item.");
      }
    } finally {
      setModalSaving(false);
    }
  };

  const handleToggleStatus = async (item: NavigationItem) => {
    const nextStatus: NavigationStatus = item.status === "published" ? "draft" : "published";
    setActionInProgress(item.public_id);
    try {
      await adminApi.updateNavigationItem(item.public_id, { status: nextStatus });
      setSuccessMessage(`Set "${item.label}" to ${nextStatus}.`);
      startTransition(() => {
        loadItems();
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Failed to change status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleArchive = async (item: NavigationItem) => {
    if (!confirm(`Are you sure you want to archive navigation item "${item.label}"? It will no longer appear on the storefront.`)) return;
    setActionInProgress(item.public_id);
    try {
      await adminApi.archiveNavigationItem(item.public_id);
      setSuccessMessage(`Archived "${item.label}".`);
      startTransition(() => {
        loadItems();
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Failed to archive navigation item.");
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: NavigationStatus) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "scheduled":
        return <Badge variant="warning">Scheduled</Badge>;
      case "draft":
        return <Badge variant="muted">Draft</Badge>;
      case "archived":
        return <Badge variant="danger">Archived</Badge>;
    }
  };

  const getSectionBadge = (section: NavigationSection) => {
    if (section === "categories") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          Row 1: Categories
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
        Row 2: Curated
      </span>
    );
  };

  const getTypeBadge = (type: NavigationDestinationType) => {
    return (
      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border">
        {DESTINATION_TYPE_LABELS[type] || type}
      </span>
    );
  };

  // Quick stats
  const totalItems = items.length;
  const publishedCount = items.filter((i) => i.status === "published").length;
  const categoryCount = items.filter((i) => i.section === "categories" && i.status === "published").length;
  const curatedCount = items.filter((i) => i.section === "curated" && i.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-lumera-text">Storefront Navigation</h1>
          </div>
          <p className="text-xs text-lumera-text-muted mt-1">
            Configure two-row desktop navigation, mobile drawer sections, and curated shopping destinations (ADR-0020)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Can permission="content.manage">
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Navigation Item
            </Button>
          </Can>
        </div>
      </div>

      {/* Feedback alerts */}
      {error && <Alert variant="danger" title="Error">{error}</Alert>}
      {successMessage && <Alert variant="success" title="Success">{successMessage}</Alert>}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-xs text-lumera-text-muted">Total Configured</div>
          <div className="text-xl font-bold text-lumera-text mt-0.5">{totalItems}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-lumera-text-muted">Live Published</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{publishedCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-lumera-text-muted">Row 1 Categories (Live)</div>
          <div className="text-xl font-bold text-lumera-text mt-0.5">{categoryCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-lumera-text-muted">Row 2 Curated (Live)</div>
          <div className="text-xl font-bold text-lumera-text mt-0.5">{curatedCount}</div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-lumera-text-muted" />
            <input
              type="text"
              placeholder="Search labels, destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadItems()}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Navigation Sections</option>
              <option value="categories">Row 1: Product Categories</option>
              <option value="curated">Row 2: Curated Destinations</option>
            </select>
          </div>

          <div>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Destination Types</option>
              <option value="category">Category</option>
              <option value="origin">Origin</option>
              <option value="audience">Audience</option>
              <option value="collection">Collection</option>
              <option value="offers">Offers</option>
              <option value="ordering">Ordering</option>
              <option value="internal_path">Internal Path</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Items Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-lumera-border text-lumera-text-muted">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">Order</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Label & Details</th>
                <th className="py-2.5 px-3">Destination & Preview</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Schedule</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lumera-border">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-lumera-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading navigation items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-lumera-text-muted">
                    No navigation items found matching current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.public_id} className="hover:bg-muted/20 transition-colors">
                    {/* Sort Order */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-lumera-text-muted">
                      {item.sort_order}
                    </td>

                    {/* Section */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getSectionBadge(item.section)}
                    </td>

                    {/* Label */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-lumera-text">{item.label}</span>
                        {item.is_highlighted && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                            <Sparkles className="h-2.5 w-2.5" />
                            Highlighted
                          </span>
                        )}
                        {item.badge_text && (
                          <span className="text-[10px] px-1.5 py-0.2 font-bold uppercase rounded bg-rose-500 text-white">
                            {item.badge_text}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-lumera-text-muted mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </td>

                    {/* Destination & Preview */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {getTypeBadge(item.destination_type)}
                        {item.destination_value && (
                          <span className="font-mono text-[11px] text-lumera-text font-medium">
                            {item.destination_value}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary font-mono truncate max-w-xs">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.url}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-3 whitespace-nowrap text-lumera-text-muted text-[11px]">
                      {item.start_at || item.end_at ? (
                        <div className="flex items-center gap-1" title={`From ${item.start_at || 'now'} to ${item.end_at || 'forever'}`}>
                          <Clock className="h-3.5 w-3.5 text-lumera-text-muted shrink-0" />
                          <span>
                            {item.start_at ? new Date(item.start_at).toLocaleDateString() : "Active"} -{" "}
                            {item.end_at ? new Date(item.end_at).toLocaleDateString() : "Indefinite"}
                          </span>
                        </div>
                      ) : (
                        <span>Always Active</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Can permission="content.manage">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                            disabled={actionInProgress === item.public_id}
                            title={item.status === "published" ? "Unpublish to draft" : "Publish item"}
                          >
                            {item.status === "published" ? (
                              <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            disabled={actionInProgress === item.public_id}
                            title="Edit navigation item"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {item.status !== "archived" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(item)}
                              disabled={actionInProgress === item.public_id}
                              className="text-red-500 hover:text-red-700"
                              title="Archive item"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-lumera-card rounded-lg border border-lumera-border shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-lumera-border">
              <h2 className="text-lg font-bold text-lumera-text">
                {editingItem ? `Edit: ${editingItem.label}` : "Create Navigation Item"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-lumera-text-muted hover:text-lumera-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 overflow-y-auto pr-1">
              {modalError && <Alert variant="danger" title="Validation Error">{modalError}</Alert>}

              {/* Label & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. Fresh Produce or Family Routine"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-lumera-text-muted">Display title in navigation bar</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Navigation Row / Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value as NavigationSection })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="categories">Row 1: Product Categories</option>
                    <option value="curated">Row 2: Curated Shopping Destinations</option>
                  </select>
                  <span className="text-[10px] text-lumera-text-muted">Which row in the storefront header</span>
                </div>
              </div>

              {/* Destination Type & Destination Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Destination Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.destination_type}
                    onChange={(e) => {
                      const nextType = e.target.value as NavigationDestinationType;
                      setFormData({
                        ...formData,
                        destination_type: nextType,
                        destination_value: nextType === "offers" && !formData.destination_value ? "true" : formData.destination_value,
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="category">Product Category (/products?category=...)</option>
                    <option value="origin">Origin Filter (/products?origin=...)</option>
                    <option value="audience">Audience Filter (/products?audience=...)</option>
                    <option value="collection">Collection Filter (/products?collection=...)</option>
                    <option value="offers">Offers (/products?offers=true)</option>
                    <option value="ordering">Ordering (/products?ordering=...)</option>
                    <option value="internal_path">Custom Internal Path (/...)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Destination Value
                  </label>
                  <input
                    type="text"
                    placeholder={DESTINATION_HELPERS[formData.destination_type].placeholder}
                    value={formData.destination_value || ""}
                    onChange={(e) => setFormData({ ...formData, destination_value: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <span className="text-[10px] text-lumera-text-muted block mt-0.5">
                    {DESTINATION_HELPERS[formData.destination_type].helper}
                  </span>
                </div>
              </div>

              {/* Badges, Highlight & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="e.g. HOT, NEW, 30% OFF"
                    value={formData.badge_text || ""}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order ?? 0}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-lumera-text-muted">Ascending display order (0, 10, 20...)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as NavigationStatus })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="published">Published (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="scheduled">Scheduled (Timed)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Highlight Checkbox */}
              <div className="p-3 bg-muted/30 rounded-md border border-lumera-border flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_highlighted"
                  checked={formData.is_highlighted || false}
                  onChange={(e) => setFormData({ ...formData, is_highlighted: e.target.checked })}
                  className="h-4 w-4 rounded border-lumera-border text-primary focus:ring-primary"
                />
                <label htmlFor="is_highlighted" className="text-xs text-lumera-text font-medium cursor-pointer">
                  Featured / Highlighted Style
                  <span className="block text-[10px] text-lumera-text-muted">
                    Renders with accent background pill and spark icon in storefront (like Family Routine)
                  </span>
                </label>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    Start Publishing (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at || ""}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value || null })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-lumera-text mb-1">
                    End Publishing (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at || ""}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value || null })}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-lumera-text mb-1">
                  Description / Staff Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Internal notes or subtitle for this navigation destination..."
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-lumera-border bg-lumera-card text-lumera-text focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-lumera-border">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalSaving}>
                  {modalSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  {editingItem ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
