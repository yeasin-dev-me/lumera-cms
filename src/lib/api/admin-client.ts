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

  async transitionOrder(
    publicId: string,
    payload: import("@/types/orders").OrderTransitionPayload
  ): Promise<import("@/types/orders").AdminOrderDetail> {
    return this.request<import("@/types/orders").AdminOrderDetail>(
      `/admin/orders/${encodeURIComponent(publicId)}/transition/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async updateOrderFulfillment(
    publicId: string,
    payload: import("@/types/orders").FulfillmentUpdatePayload
  ): Promise<import("@/types/orders").AdminOrderDetail> {
    return this.request<import("@/types/orders").AdminOrderDetail>(
      `/admin/orders/${encodeURIComponent(publicId)}/fulfillment/`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  async getOrderReport(params?: { from?: string; to?: string; currency?: string }): Promise<import("@/types/orders").AdminOrderReport> {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.currency) searchParams.set("currency", params.currency);
    const query = searchParams.toString();
    return this.request<import("@/types/orders").AdminOrderReport>(
      query ? `/admin/reports/orders/?${query}` : "/admin/reports/orders/"
    );
  }

  async getReturns(params?: { status?: string }): Promise<import("@/types/orders").PaginatedAdminReturns> {
    const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return this.request<import("@/types/orders").PaginatedAdminReturns>(`/admin/returns/${query}`);
  }

  async transitionReturn(
    publicId: string,
    action: "approve" | "reject" | "receive",
    staff_note = ""
  ): Promise<import("@/types/orders").AdminReturnRequest> {
    return this.request<import("@/types/orders").AdminReturnRequest>(
      `/admin/returns/${encodeURIComponent(publicId)}/${action}/`,
      { method: "POST", body: JSON.stringify({ staff_note }) }
    );
  }

  async getRefunds(): Promise<import("@/types/orders").PaginatedAdminRefunds> {
    return this.request<import("@/types/orders").PaginatedAdminRefunds>("/admin/refunds/");
  }

  // Content Management (Step 10, ADR-0017)
  async getContentBlocks(params?: {
    status?: string;
    content_type?: string;
    search?: string;
  }): Promise<import("@/types/content").ContentBlock[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.content_type) searchParams.set("content_type", params.content_type);
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return this.request<import("@/types/content").ContentBlock[]>(
      query ? `/admin/content/?${query}` : "/admin/content/"
    );
  }

  async getContentBlock(publicId: string): Promise<import("@/types/content").ContentBlock> {
    return this.request<import("@/types/content").ContentBlock>(
      `/admin/content/${encodeURIComponent(publicId)}/`
    );
  }

  async createContentBlock(
    payload: import("@/types/content").ContentBlockInput
  ): Promise<import("@/types/content").ContentBlock> {
    return this.request<import("@/types/content").ContentBlock>("/admin/content/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateContentBlock(
    publicId: string,
    payload: Partial<import("@/types/content").ContentBlockInput>
  ): Promise<import("@/types/content").ContentBlock> {
    return this.request<import("@/types/content").ContentBlock>(
      `/admin/content/${encodeURIComponent(publicId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteContentBlock(publicId: string): Promise<void> {
    return this.request<void>(`/admin/content/${encodeURIComponent(publicId)}/`, {
      method: "DELETE",
    });
  }

  async publishContentBlock(publicId: string): Promise<import("@/types/content").ContentBlock> {
    return this.request<import("@/types/content").ContentBlock>(
      `/admin/content/${encodeURIComponent(publicId)}/publish/`,
      { method: "POST" }
    );
  }

  async unpublishContentBlock(publicId: string): Promise<import("@/types/content").ContentBlock> {
    return this.request<import("@/types/content").ContentBlock>(
      `/admin/content/${encodeURIComponent(publicId)}/unpublish/`,
      { method: "POST" }
    );
  }

  async archiveContentBlock(publicId: string): Promise<import("@/types/content").ContentBlock> {
    return this.request<import("@/types/content").ContentBlock>(
      `/admin/content/${encodeURIComponent(publicId)}/archive/`,
      { method: "POST" }
    );
  }

  async getCampaigns(): Promise<import("@/types/content").Campaign[]> {
    return this.request<import("@/types/content").Campaign[]>("/admin/campaigns/");
  }

  async createCampaign(
    payload: import("@/types/content").CampaignInput
  ): Promise<import("@/types/content").Campaign> {
    return this.request<import("@/types/content").Campaign>("/admin/campaigns/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getNotifications(
    filters?: import("@/types/notifications").NotificationFilters
  ): Promise<import("@/types/notifications").PaginatedAdminNotifications> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.event_type) params.append("event_type", filters.event_type);
    if (filters?.recipient) params.append("recipient", filters.recipient);
    if (filters?.page) params.append("page", String(filters.page));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<import("@/types/notifications").PaginatedAdminNotifications>(
      `/admin/notifications/${qs}`
    );
  }

  async getNotification(
    publicId: string
  ): Promise<import("@/types/notifications").AdminNotification> {
    return this.request<import("@/types/notifications").AdminNotification>(
      `/admin/notifications/${encodeURIComponent(publicId)}/`
    );
  }

  async resendNotification(
    publicId: string
  ): Promise<import("@/types/notifications").AdminNotification> {
    return this.request<import("@/types/notifications").AdminNotification>(
      `/admin/notifications/${encodeURIComponent(publicId)}/resend/`,
      { method: "POST" }
    );
  }
}

export const adminApi = new AdminApiClient();
