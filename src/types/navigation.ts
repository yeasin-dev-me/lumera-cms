export type NavigationSection = "categories" | "curated";

export type NavigationDestinationType =
  | "category"
  | "origin"
  | "audience"
  | "collection"
  | "offers"
  | "ordering"
  | "internal_path";

export type NavigationStatus = "draft" | "scheduled" | "published" | "archived";

export interface NavigationItem {
  public_id: string;
  label: string;
  section: NavigationSection;
  destination_type: NavigationDestinationType;
  destination_value: string;
  url: string;
  badge_text: string;
  description: string;
  is_highlighted: boolean;
  sort_order: number;
  status: NavigationStatus;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NavigationItemInput {
  label: string;
  section: NavigationSection;
  destination_type: NavigationDestinationType;
  destination_value: string;
  badge_text?: string;
  description?: string;
  is_highlighted?: boolean;
  sort_order?: number;
  status?: NavigationStatus;
  start_at?: string | null;
  end_at?: string | null;
}
