export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  status: "draft" | "active" | "archived";
  sort_order: number;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  status?: "draft" | "active" | "archived";
  sort_order?: number;
  seo_title?: string;
  seo_description?: string;
}

export interface ProductImage {
  id?: number;
  image_url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}

export interface ProductDetail {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  sku: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  description: string;
  price: string;
  discount_price: string | null;
  effective_price: string;
  stock_quantity: number;
  is_in_stock: boolean;
  status: "draft" | "active" | "archived";
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title?: string;
  seo_description?: string;
  images: ProductImage[];
  primary_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  slug: string;
  sku: string;
  category_id: number;
  description?: string;
  price: string;
  discount_price?: string | null;
  stock_quantity?: number;
  status?: "draft" | "active" | "archived";
  is_visible?: boolean;
  is_featured?: boolean;
  sort_order?: number;
  seo_title?: string;
  seo_description?: string;
  images?: ProductImage[];
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductDetail[];
}

export interface ProductFilterParams {
  category_id?: number;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
