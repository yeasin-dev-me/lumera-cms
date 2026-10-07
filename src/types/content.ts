export type ContentType =
  | "hero"
  | "banner"
  | "announcement"
  | "promotional_section"
  | "content_section";

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

export interface ContentBlock {
  public_id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  body: string;
  image_url: string;
  alt_text: string;
  cta_label: string;
  cta_url: string;
  linked_product_id: string | null;
  linked_category_slug: string | null;
  campaign_id: string | null;
  status: ContentStatus;
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentBlockInput {
  title: string;
  slug: string;
  content_type: ContentType;
  body?: string;
  image_url?: string;
  alt_text?: string;
  cta_label?: string;
  cta_url?: string;
  linked_product_id?: string | null;
  linked_category_slug?: string | null;
  campaign_id?: string | null;
  status?: ContentStatus;
  start_at?: string | null;
  end_at?: string | null;
  sort_order?: number;
}

export interface Campaign {
  public_id: string;
  name: string;
  slug: string;
  description: string;
  badge_text: string;
  status: "draft" | "active" | "archived";
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignInput {
  name: string;
  slug: string;
  description?: string;
  badge_text?: string;
  status?: "draft" | "active" | "archived";
  start_at?: string | null;
  end_at?: string | null;
}
