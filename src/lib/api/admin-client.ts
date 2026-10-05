import { AdminApiErrorPayload, HealthStatus, StaffUser } from "@/types/admin";

export class AdminApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;

  constructor(status: number, payload: AdminApiErrorPayload) {
    super(payload.message || "Admin API error");
    this.name = "AdminApiError";
    this.status = status;
    this.code = payload.code || "unknown_error";
    this.details = payload.details;
  }
}

class AdminApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:8000/api/v1";
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorPayload: AdminApiErrorPayload = {
          code: "http_error",
          message: `Request failed with status ${response.status}`,
        };

        try {
          const data = await response.json();
          if (data && data.error) {
            errorPayload = data.error;
          }
        } catch {
          // not JSON
        }

        throw new AdminApiError(response.status, errorPayload);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        throw err;
      }
      throw new AdminApiError(0, {
        code: "network_error",
        message: err instanceof Error ? err.message : "Failed to connect to backend",
      });
    }
  }

  // System & Health
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/health/");
  }

  // Staff Identity & Auth
  async login(payload: import("@/types/admin").StaffLoginPayload): Promise<import("@/types/admin").StaffAuthResponse> {
    return this.request<import("@/types/admin").StaffAuthResponse>("/admin/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async refresh(refreshToken: string): Promise<import("@/types/admin").TokenRefreshResponse> {
    return this.request<import("@/types/admin").TokenRefreshResponse>("/admin/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  async logout(refreshToken?: string): Promise<{ status: string }> {
    return this.request<{ status: string }>("/admin/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken || "" }),
    });
  }

  async getMe(): Promise<StaffUser> {
    return this.request<StaffUser>("/admin/auth/me/");
  }

  // Categories Operations
  async getCategories(): Promise<import("@/types/catalog").Category[]> {
    return this.request<import("@/types/catalog").Category[]>("/admin/categories/");
  }

  async getCategory(id: number | string): Promise<import("@/types/catalog").Category> {
    return this.request<import("@/types/catalog").Category>(`/admin/categories/${id}/`);
  }

  async createCategory(data: import("@/types/catalog").CategoryInput): Promise<import("@/types/catalog").Category> {
    return this.request<import("@/types/catalog").Category>("/admin/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    id: number | string,
    data: Partial<import("@/types/catalog").CategoryInput>
  ): Promise<import("@/types/catalog").Category> {
    return this.request<import("@/types/catalog").Category>(`/admin/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number | string): Promise<void> {
    await this.request<void>(`/admin/categories/${id}/`, {
      method: "DELETE",
    });
  }

  // Products Operations
  async getProducts(
    params?: import("@/types/catalog").ProductFilterParams
  ): Promise<import("@/types/catalog").PaginatedProducts> {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.set("category_id", params.category_id.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.page_size) searchParams.set("page_size", params.page_size.toString());

    const qs = searchParams.toString();
    const endpoint = qs ? `/admin/products/?${qs}` : "/admin/products/";
    return this.request<import("@/types/catalog").PaginatedProducts>(endpoint);
  }

  async getProduct(id: number | string): Promise<import("@/types/catalog").ProductDetail> {
    return this.request<import("@/types/catalog").ProductDetail>(`/admin/products/${id}/`);
  }

  async createProduct(data: import("@/types/catalog").ProductInput): Promise<import("@/types/catalog").ProductDetail> {
    return this.request<import("@/types/catalog").ProductDetail>("/admin/products/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProduct(
    id: number | string,
    data: Partial<import("@/types/catalog").ProductInput>
  ): Promise<import("@/types/catalog").ProductDetail> {
    return this.request<import("@/types/catalog").ProductDetail>(`/admin/products/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number | string): Promise<void> {
    await this.request<void>(`/admin/products/${id}/`, {
      method: "DELETE",
    });
  }

  // Orders module (ADR-0013)
  async getOrders(params?: import("@/types/orders").AdminOrderListParams): Promise<import("@/types/orders").PaginatedAdminOrders> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.payment_status) searchParams.set("payment_status", params.payment_status);
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    const endpoint = query ? `/admin/orders/?${query}` : "/admin/orders/";
    return this.request<import("@/types/orders").PaginatedAdminOrders>(endpoint);
  }

  async getOrder(publicId: string): Promise<import("@/types/orders").AdminOrderDetail> {
    return this.request<import("@/types/orders").AdminOrderDetail>(`/admin/orders/${encodeURIComponent(publicId)}/`);
  }
}

export const adminApi = new AdminApiClient();

