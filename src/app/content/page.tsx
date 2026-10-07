"use client";

import { useEffect, useState, useTransition } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ContentBlock, ContentBlockInput, ContentType, ContentStatus } from "@/types/content";
import { Can, usePermissions } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  FileText,
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
} from "lucide-react";

const initialForm: ContentBlockInput = {
  title: "",
  slug: "",
  content_type: "banner",
  body: "",
  image_url: "",
  alt_text: "",
  cta_label: "",
  cta_url: "",
  linked_product_id: null,
  linked_category_slug: null,
  status: "draft",
  start_at: null,
  end_at: null,
  sort_order: 0,
};

export default function ContentManagementPage() {
  const { hasPermission } = usePermissions();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [formData, setFormData] = useState<ContentBlockInput>(initialForm);
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Action transitions
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; content_type?: string; search?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.content_type = typeFilter;
      if (search.trim()) params.search = search.trim();

      const data = await adminApi.getContentBlocks(params);
      setBlocks(data);
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load content blocks.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("content.read")) {
      loadBlocks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingBlock(null);
    setFormData(initialForm);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (block: ContentBlock) => {
    setEditingBlock(block);
    setFormData({
      title: block.title,
      slug: block.slug,
      content_type: block.content_type,
      body: block.body,
      image_url: block.image_url,
      alt_text: block.alt_text,
      cta_label: block.cta_label,
      cta_url: block.cta_url,
      linked_product_id: block.linked_product_id,
      linked_category_slug: block.linked_category_slug,
      status: block.status,
      start_at: block.start_at ? block.start_at.slice(0, 16) : null,
      end_at: block.end_at ? block.end_at.slice(0, 16) : null,
      sort_order: block.sort_order,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    const payload: ContentBlockInput = {
      ...formData,
      start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
      end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
    };

    try {
      if (editingBlock) {
        await adminApi.updateContentBlock(editingBlock.public_id, payload);
      } else {
        await adminApi.createContentBlock(payload);
      }
      setIsModalOpen(false);
      loadBlocks();
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        setModalError(err.message);
      } else {
        setModalError("Unable to save content block.");
      }
    } finally {
      setModalSaving(false);
    }
  };

  const handlePublish = async (block: ContentBlock) => {
    setActionInProgress(block.public_id);
    try {
      await adminApi.publishContentBlock(block.public_id);
      startTransition(() => {
        loadBlocks();
      });
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Failed to publish content.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnpublish = async (block: ContentBlock) => {
    setActionInProgress(block.public_id);
    try {
      await adminApi.unpublishContentBlock(block.public_id);
      startTransition(() => {
        loadBlocks();
      });
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Failed to unpublish content.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleArchive = async (block: ContentBlock) => {
    if (!confirm(`Are you sure you want to archive "${block.title}"?`)) return;
    setActionInProgress(block.public_id);
    try {
      await adminApi.archiveContentBlock(block.public_id);
      startTransition(() => {
        loadBlocks();
      });
    } catch (err: unknown) {
      setError(err instanceof AdminApiError ? err.message : "Failed to archive content.");
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
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

  const getTypeBadge = (type: ContentType) => {
    const labels: Record<ContentType, string> = {
      hero: "Hero Banner",
      banner: "Promo Banner",
      announcement: "Announcement",
      promotional_section: "Promo Section",
      content_section: "Content Section",
    };
    return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">{labels[type] || type}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lumera-text">Storefront Content</h1>
          <p className="text-xs text-lumera-text-muted mt-1">
            Manage editorial heroes, banners, announcements, and promotional copy (Step 10, ADR-0017)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadBlocks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Can permission="content.manage">
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Content Block
            </Button>
          </Can>
        </div>
      </div>

      {error && <Alert variant="danger" title="Error">{error}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-lumera-text-muted" />
            <input
              type="text"
              placeholder="Search content by title, slug, copy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadBlocks()}
              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded border border-border bg-background text-lumera-text"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded border border-border bg-background text-lumera-text"
            >
              <option value="all">All Content Types</option>
              <option value="hero">Hero Banner</option>
              <option value="banner">Promo Banner</option>
              <option value="announcement">Announcement</option>
              <option value="promotional_section">Promotional Section</option>
              <option value="content_section">Content Section</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-lumera-text-muted flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-lumera-primary" />
            Loading editorial content...
          </div>
        ) : blocks.length === 0 ? (
          <div className="py-16 text-center text-xs text-lumera-text-muted space-y-3">
            <FileText className="h-10 w-10 mx-auto text-lumera-text-muted opacity-40" />
            <p>No content blocks found matching the active filters.</p>
            <Can permission="content.manage">
              <Button size="sm" variant="secondary" onClick={handleOpenCreate}>
                Create First Block
              </Button>
            </Can>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-lumera-text-muted font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Slot / Type</th>
                  <th className="px-4 py-3">Title & Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Schedule Window</th>
                  <th className="px-4 py-3">Call to Action</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blocks.map((block) => (
                  <tr key={block.public_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getTypeBadge(block.content_type)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-lumera-text flex items-center gap-1.5">
                        {block.title}
                        {block.image_url && <Sparkles className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="text-[11px] text-lumera-text-muted font-mono">{block.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(block.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-lumera-text-muted text-[11px]">
                      {block.start_at || block.end_at ? (
                        <div>
                          <div>Start: {block.start_at ? new Date(block.start_at).toLocaleDateString() : "Immediate"}</div>
                          <div>End: {block.end_at ? new Date(block.end_at).toLocaleDateString() : "Indefinite"}</div>
                        </div>
                      ) : (
                        "Always active in published status"
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-lumera-text-muted">
                      {block.cta_label ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lumera-primary">
                          {block.cta_label}
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Can permission="content.manage">
                          {block.status === "draft" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handlePublish(block)}
                              disabled={actionInProgress === block.public_id}
                              className="text-emerald-600 hover:text-emerald-700 h-7 text-[11px]"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Publish
                            </Button>
                          )}
                          {block.status === "published" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUnpublish(block)}
                              disabled={actionInProgress === block.public_id}
                              className="text-amber-600 hover:text-amber-700 h-7 text-[11px]"
                            >
                              <EyeOff className="h-3.5 w-3.5 mr-1" />
                              Unpublish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenEdit(block)}
                            className="h-7 w-7 p-0"
                            title="Edit content block"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {block.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleArchive(block)}
                              disabled={actionInProgress === block.public_id}
                              className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700"
                              title="Archive content block"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-base font-bold text-lumera-text">
                {editingBlock ? `Edit "${editingBlock.title}"` : "Create New Content Block"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-lumera-text-muted hover:text-lumera-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && <Alert variant="danger" title="Validation Error">{modalError}</Alert>}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                    placeholder="e.g. Botanical Skincare Renewal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">
                    Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text font-mono"
                    placeholder="botanical-skincare-renewal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">Content Type</label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value as ContentType })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                  >
                    <option value="hero">Hero Banner</option>
                    <option value="banner">Promo Banner</option>
                    <option value="announcement">Announcement Bar</option>
                    <option value="promotional_section">Promotional Section</option>
                    <option value="content_section">Content Section</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-lumera-text mb-1">Editorial Body / Copy</label>
                <textarea
                  rows={3}
                  value={formData.body || ""}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                  placeholder="Pure cold-pressed botanicals crafted for skin barrier protection..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url || ""}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                    placeholder="https://images.example.com/banner.jpg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={formData.alt_text || ""}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                    placeholder="Botanical serum bottle on stone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">CTA Label</label>
                  <input
                    type="text"
                    value={formData.cta_label || ""}
                    onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                    placeholder="Explore Collection"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">CTA URL</label>
                  <input
                    type="text"
                    value={formData.cta_url || ""}
                    onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                    placeholder="/products or /products?category=face-oils"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">Schedule Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_at || ""}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value || null })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-lumera-text mb-1">Schedule End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_at || ""}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value || null })}
                    className="w-full px-3 py-2 text-xs rounded border border-border bg-background text-lumera-text"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <span className="text-[10px] font-mono text-lumera-text-muted uppercase">Live Preview Rendering</span>
                <div className="p-4 rounded-md border border-border bg-surface flex flex-col items-center text-center space-y-2">
                  <h3 className="font-serif text-base font-semibold text-lumera-text">
                    {formData.title || "Preview Title"}
                  </h3>
                  <p className="text-xs text-lumera-text-muted max-w-sm">
                    {formData.body || "Preview promotional copy describing the botanical formula or active campaign."}
                  </p>
                  {formData.cta_label && (
                    <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-lumera-primary text-white">
                      {formData.cta_label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={modalSaving}>
                  {editingBlock ? "Save Changes" : "Create Block"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
