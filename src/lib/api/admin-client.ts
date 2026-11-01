import { AdminApiErrorPayload, HealthStatus, StaffUser } from "@/types/admin";
import {
  AccountingPeriod,
  BusinessProfile,
  BusinessProfileUpdatePayload,
  CurrencyConfig,
  FiscalYear,
  FiscalYearCreatePayload,
  NumberingSequence,
  NumberingSequenceUpdatePayload,
} from "@/types/business";
import {
  BatchLot,
  BatchLotCreatePayload,
  CostLayer,
  PaginatedResponse,
  StockAdjustment,
  StockAdjustmentCreatePayload,
  StockMovement,
  StockSummaryResponse,
} from "@/types/inventory";
import {
  LandedCostPreviewInput,
  PurchaseBill,
  PurchaseBillInput,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseReceipt,
  PurchaseReceiptInput,
  Supplier,
  SupplierInput,
} from "@/types/procurement";
import {
  ClosePOSSessionInput,
  CreateCreditNoteInput,
  CreateSalesReturnInput,
  CreateWholesaleInvoiceInput,
  CreditNote,
  InspectReturnInput,
  OpenPOSSessionInput,
  POSCheckoutInput,
  POSSession,
  SalesInvoice,
  SalesReturn,
} from "@/types/sales";
import {
  CreditSummary,
  CustomerLedgerEntry,
  CustomerPaymentAllocation,
  CustomerProfile,
  CustomerStatement,
  OutstandingInvoiceSummary,
  ReceivablesAging,
  ReceivablesSummary,
  SupplierStatement,
} from "@/types/customers";
import {
  AccountCashbookResponse,
  BankReconciliation,
  BankStatementLine,
  CashCountReconciliation,
  CourierRemittanceLine,
  CourierRemittanceSheet,
  CustomerReceipt,
  FinancialAccount,
  FinancialAccountTransaction,
  FundTransfer,
  GatewaySettlementBatch,
  GatewaySettlementLine,
  SupplierDisbursement,
  TreasuryDashboardSummary,
} from "@/types/treasury";
import {
  CapitalContribution,
  ExpenseCategory,
  ExpenseCategoryBreakdownItem,
  ExpenseDashboardMetrics,
  ExpenseDisbursement,
  ExpenseVoucher,
  ExpenseVoucherAttachment,
  FinanceSummary,
  LoanContract,
  LoanRepayment,
  LoanRepaymentSchedule,
  OwnerDrawing,
} from "@/types/expenses";
import {
  Account,
  AccountCreatePayload,
  AccountTreeNode,
  AccountUpdatePayload,
  AccountingDashboardMetrics,
  AccountingPeriodInfo,
  GeneralLedgerReport,
  JournalEntry,
  JournalEntryCreatePayload,
  JournalEntryUpdatePayload,
  PeriodReadinessReport,
  TrialBalanceReport,
} from "@/types/accounting";
import {
  AccountingEvent,
  AccountingEventMapping,
  AccountingEventMappingVersion,
  ConsolidatedReconciliationReport,
  DryRunPreviewResult,
  EventQueueStats,
  ExpenseCategoryAccountMapping,
  SubledgerReconciliationSummary,
  TreasuryAccountMapping,
} from "@/types/events";

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

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private buildQuery(params: Record<string, any>): string {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        sp.set(key, String(val));
      }
    }
    const q = sp.toString();
    return q ? `?${q}` : "";
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

    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

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

  // Navigation Management (ADR-0020)
  async getNavigationItems(
    params?: { section?: string; status?: string; search?: string }
  ): Promise<import("@/types/navigation").NavigationItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.section) searchParams.append("section", params.section);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request<import("@/types/navigation").NavigationItem[]>(
      `/admin/content/navigation/${qs}`
    );
  }

  async getNavigationItem(
    publicId: string
  ): Promise<import("@/types/navigation").NavigationItem> {
    return this.request<import("@/types/navigation").NavigationItem>(
      `/admin/content/navigation/${encodeURIComponent(publicId)}/`
    );
  }

  async createNavigationItem(
    payload: import("@/types/navigation").NavigationItemInput
  ): Promise<import("@/types/navigation").NavigationItem> {
    return this.request<import("@/types/navigation").NavigationItem>(
      "/admin/content/navigation/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async updateNavigationItem(
    publicId: string,
    payload: Partial<import("@/types/navigation").NavigationItemInput>
  ): Promise<import("@/types/navigation").NavigationItem> {
    return this.request<import("@/types/navigation").NavigationItem>(
      `/admin/content/navigation/${encodeURIComponent(publicId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  async archiveNavigationItem(publicId: string): Promise<void> {
    return this.request<void>(
      `/admin/content/navigation/${encodeURIComponent(publicId)}/`,
      { method: "DELETE" }
    );
  }

  // Business Foundation & Settings (apps.business - Step 01)
  async getBusinessProfile(): Promise<BusinessProfile> {
    return this.request<BusinessProfile>("/admin/business/profile/");
  }

  async updateBusinessProfile(payload: BusinessProfileUpdatePayload): Promise<BusinessProfile> {
    return this.request<BusinessProfile>("/admin/business/profile/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async getCurrencies(): Promise<{ count: number; results: CurrencyConfig[] } | CurrencyConfig[]> {
    return this.request<{ count: number; results: CurrencyConfig[] } | CurrencyConfig[]>("/admin/business/currencies/");
  }

  async setBaseCurrency(code: string, isApproved: boolean = false): Promise<CurrencyConfig> {
    return this.request<CurrencyConfig>(`/admin/business/currencies/${encodeURIComponent(code)}/set-base/`, {
      method: "POST",
      body: JSON.stringify({ is_approved: isApproved }),
    });
  }

  async getFiscalYears(): Promise<{ count: number; results: FiscalYear[] } | FiscalYear[]> {
    return this.request<{ count: number; results: FiscalYear[] } | FiscalYear[]>("/admin/business/fiscal-years/");
  }

  async createFiscalYear(payload: FiscalYearCreatePayload): Promise<FiscalYear> {
    return this.request<FiscalYear>("/admin/business/fiscal-years/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getFiscalYearPeriods(publicId: string): Promise<AccountingPeriod[]> {
    return this.request<AccountingPeriod[]>(`/admin/business/fiscal-years/${encodeURIComponent(publicId)}/periods/`);
  }

  async generateFiscalYearPeriods(publicId: string): Promise<AccountingPeriod[]> {
    return this.request<AccountingPeriod[]>(`/admin/business/fiscal-years/${encodeURIComponent(publicId)}/periods/`, {
      method: "POST",
    });
  }

  async getAccountingPeriods(params?: { fiscal_year?: string; is_closed?: boolean }): Promise<{ count: number; results: AccountingPeriod[] } | AccountingPeriod[]> {
    const query = new URLSearchParams();
    if (params?.fiscal_year) query.set("fiscal_year", params.fiscal_year);
    if (params?.is_closed !== undefined) query.set("is_closed", String(params.is_closed));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<{ count: number; results: AccountingPeriod[] } | AccountingPeriod[]>(`/admin/business/periods/${qs}`);
  }

  async getNumberingSequences(): Promise<{ count: number; results: NumberingSequence[] } | NumberingSequence[]> {
    return this.request<{ count: number; results: NumberingSequence[] } | NumberingSequence[]>("/admin/business/numbering-sequences/");
  }

  async updateNumberingSequence(docType: string, payload: NumberingSequenceUpdatePayload): Promise<NumberingSequence> {
    return this.request<NumberingSequence>(`/admin/business/numbering-sequences/${encodeURIComponent(docType)}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async previewNextNumberingSequence(docType: string): Promise<{ doc_type: string; preview: string }> {
    return this.request<{ doc_type: string; preview: string }>(`/admin/business/numbering-sequences/${encodeURIComponent(docType)}/preview-next/`, {
      method: "POST",
    });
  }

  // Product & Inventory Management (apps.inventory - Step 02)
  async getStockSummary(params?: {
    q?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<StockSummaryResponse>> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<StockSummaryResponse>>(`/admin/inventory/stock-summary/${qs}`);
  }

  async getStockMovements(params?: {
    product_id?: number;
    sku?: string;
    movement_type?: string;
    source_type?: string;
    source_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<StockMovement[]>> {
    const query = new URLSearchParams();
    if (params?.product_id) query.set("product_id", String(params.product_id));
    if (params?.sku) query.set("sku", params.sku);
    if (params?.movement_type) query.set("movement_type", params.movement_type);
    if (params?.source_type) query.set("source_type", params.source_type);
    if (params?.source_id) query.set("source_id", params.source_id);
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<StockMovement[]>>(`/admin/inventory/movements/${qs}`);
  }

  async getBatchLots(params?: {
    product_id?: number;
    sku?: string;
    batch_number?: string;
    is_active?: boolean;
    expiry_status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<BatchLot[]>> {
    const query = new URLSearchParams();
    if (params?.product_id) query.set("product_id", String(params.product_id));
    if (params?.sku) query.set("sku", params.sku);
    if (params?.batch_number) query.set("batch_number", params.batch_number);
    if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
    if (params?.expiry_status) query.set("expiry_status", params.expiry_status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<BatchLot[]>>(`/admin/inventory/batches/${qs}`);
  }

  async createBatchLot(payload: BatchLotCreatePayload): Promise<BatchLot> {
    return this.request<BatchLot>("/admin/inventory/batches/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getCostLayers(params?: {
    product_id?: number;
    sku?: string;
    is_depleted?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CostLayer[]>> {
    const query = new URLSearchParams();
    if (params?.product_id) query.set("product_id", String(params.product_id));
    if (params?.sku) query.set("sku", params.sku);
    if (params?.is_depleted !== undefined) query.set("is_depleted", String(params.is_depleted));
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<CostLayer[]>>(`/admin/inventory/cost-layers/${qs}`);
  }

  async getStockAdjustments(params?: {
    status?: string;
    reason?: string;
    adjustment_number?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<StockAdjustment[]>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.reason) query.set("reason", params.reason);
    if (params?.adjustment_number) query.set("adjustment_number", params.adjustment_number);
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<StockAdjustment[]>>(`/admin/inventory/adjustments/${qs}`);
  }

  async getStockAdjustment(id: string | number): Promise<StockAdjustment> {
    return this.request<StockAdjustment>(`/admin/inventory/adjustments/${encodeURIComponent(String(id))}/`);
  }

  async createStockAdjustment(payload: StockAdjustmentCreatePayload): Promise<StockAdjustment> {
    return this.request<StockAdjustment>("/admin/inventory/adjustments/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateStockAdjustment(
    id: string | number,
    payload: { notes?: string; reason?: string }
  ): Promise<StockAdjustment> {
    return this.request<StockAdjustment>(`/admin/inventory/adjustments/${encodeURIComponent(String(id))}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async submitStockAdjustment(id: string | number): Promise<StockAdjustment> {
    return this.request<StockAdjustment>(`/admin/inventory/adjustments/${encodeURIComponent(String(id))}/submit/`, {
      method: "POST",
    });
  }

  async approveStockAdjustment(id: string | number): Promise<StockAdjustment> {
    return this.request<StockAdjustment>(`/admin/inventory/adjustments/${encodeURIComponent(String(id))}/approve/`, {
      method: "POST",
    });
  }

  async rejectStockAdjustment(id: string | number, reason?: string): Promise<StockAdjustment> {
    return this.request<StockAdjustment>(`/admin/inventory/adjustments/${encodeURIComponent(String(id))}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async cancelStockAdjustment(id: string | number): Promise<StockAdjustment> {
    return this.request<StockAdjustment>(`/admin/inventory/adjustments/${encodeURIComponent(String(id))}/cancel/`, {
      method: "POST",
    });
  }

  async createOpeningStockDraft(productIds?: number[]): Promise<StockAdjustment> {
    return this.request<StockAdjustment>("/admin/inventory/reconciliation/opening-draft/", {
      method: "POST",
      body: JSON.stringify(productIds ? { product_ids: productIds } : {}),
    });
  }

  // -------------------------------------------------------------------------
  // Procurement & Supplier Management (apps.procurement - Step 03)
  // -------------------------------------------------------------------------

  async getSuppliers(params?: {
    q?: string;
    is_active?: boolean | string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Supplier[]>> {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.page_size) sp.set("page_size", String(params.page_size));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return this.request<PaginatedResponse<Supplier[]>>(`/admin/procurement/suppliers/${qs}`);
  }

  async getSupplier(id: string | number): Promise<Supplier> {
    return this.request<Supplier>(`/admin/procurement/suppliers/${encodeURIComponent(String(id))}/`);
  }

  async createSupplier(payload: SupplierInput): Promise<Supplier> {
    return this.request<Supplier>("/admin/procurement/suppliers/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateSupplier(id: string | number, payload: Partial<SupplierInput>): Promise<Supplier> {
    return this.request<Supplier>(`/admin/procurement/suppliers/${encodeURIComponent(String(id))}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deactivateSupplier(id: string | number): Promise<Supplier> {
    return this.request<Supplier>(`/admin/procurement/suppliers/${encodeURIComponent(String(id))}/deactivate/`, {
      method: "POST",
    });
  }

  async getPurchaseOrders(params?: {
    q?: string;
    status?: string;
    supplier_id?: number | string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<PurchaseOrder[]>> {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.status) sp.set("status", params.status);
    if (params?.supplier_id) sp.set("supplier_id", String(params.supplier_id));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.page_size) sp.set("page_size", String(params.page_size));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return this.request<PaginatedResponse<PurchaseOrder[]>>(`/admin/procurement/purchase-orders/${qs}`);
  }

  async getPurchaseOrder(id: string | number): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/admin/procurement/purchase-orders/${encodeURIComponent(String(id))}/`);
  }

  async createPurchaseOrder(payload: PurchaseOrderInput): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>("/admin/procurement/purchase-orders/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async approvePurchaseOrder(id: string | number): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/admin/procurement/purchase-orders/${encodeURIComponent(String(id))}/approve/`, {
      method: "POST",
    });
  }

  async cancelPurchaseOrder(id: string | number, reason?: string): Promise<PurchaseOrder> {
    return this.request<PurchaseOrder>(`/admin/procurement/purchase-orders/${encodeURIComponent(String(id))}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ cancellation_reason: reason || "" }),
    });
  }

  async getPurchaseReceipts(params?: {
    q?: string;
    status?: string;
    purchase_order_id?: number | string;
    supplier_id?: number | string;
    has_unbilled?: boolean | string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<PurchaseReceipt[]>> {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.status) sp.set("status", params.status);
    if (params?.purchase_order_id) sp.set("purchase_order_id", String(params.purchase_order_id));
    if (params?.supplier_id) sp.set("supplier_id", String(params.supplier_id));
    if (params?.has_unbilled !== undefined) sp.set("has_unbilled", String(params.has_unbilled));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.page_size) sp.set("page_size", String(params.page_size));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return this.request<PaginatedResponse<PurchaseReceipt[]>>(`/admin/procurement/purchase-receipts/${qs}`);
  }

  async getPurchaseReceipt(id: string | number): Promise<PurchaseReceipt> {
    return this.request<PurchaseReceipt>(`/admin/procurement/purchase-receipts/${encodeURIComponent(String(id))}/`);
  }

  async createPurchaseReceipt(payload: PurchaseReceiptInput): Promise<PurchaseReceipt> {
    return this.request<PurchaseReceipt>("/admin/procurement/purchase-receipts/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async cancelPurchaseReceipt(id: string | number, reason?: string): Promise<PurchaseReceipt> {
    return this.request<PurchaseReceipt>(`/admin/procurement/purchase-receipts/${encodeURIComponent(String(id))}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async getPurchaseBills(params?: {
    q?: string;
    status?: string;
    supplier_id?: number | string;
    purchase_order_id?: number | string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<PurchaseBill[]>> {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.status) sp.set("status", params.status);
    if (params?.supplier_id) sp.set("supplier_id", String(params.supplier_id));
    if (params?.purchase_order_id) sp.set("purchase_order_id", String(params.purchase_order_id));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.page_size) sp.set("page_size", String(params.page_size));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return this.request<PaginatedResponse<PurchaseBill[]>>(`/admin/procurement/purchase-bills/${qs}`);
  }

  async getPurchaseBill(id: string | number): Promise<PurchaseBill> {
    return this.request<PurchaseBill>(`/admin/procurement/purchase-bills/${encodeURIComponent(String(id))}/`);
  }

  async createPurchaseBill(payload: PurchaseBillInput): Promise<PurchaseBill> {
    return this.request<PurchaseBill>("/admin/procurement/purchase-bills/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateBillLandedCost(id: string | number, payload: LandedCostPreviewInput): Promise<PurchaseBill> {
    return this.request<PurchaseBill>(`/admin/procurement/purchase-bills/${encodeURIComponent(String(id))}/landed-cost/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async postPurchaseBill(id: string | number): Promise<PurchaseBill> {
    return this.request<PurchaseBill>(`/admin/procurement/purchase-bills/${encodeURIComponent(String(id))}/post/`, {
      method: "POST",
    });
  }

  async cancelPurchaseBill(id: string | number, reason?: string): Promise<PurchaseBill> {
    return this.request<PurchaseBill>(`/admin/procurement/purchase-bills/${encodeURIComponent(String(id))}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  // -------------------------------------------------------------------------
  // Sales & Invoice Management (apps.sales - Step 04)
  // -------------------------------------------------------------------------

  // POS Sessions
  async getPosSessions(params?: {
    q?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<POSSession[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<POSSession[]>>(`/admin/sales/sessions/${qs}`);
  }

  async getActivePosSession(): Promise<POSSession | null> {
    return this.request<POSSession | null>("/admin/sales/sessions/active/");
  }

  async openPosSession(payload?: OpenPOSSessionInput): Promise<POSSession> {
    return this.request<POSSession>("/admin/sales/sessions/open/", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  async closePosSession(id: string | number, payload: ClosePOSSessionInput): Promise<POSSession> {
    return this.request<POSSession>(`/admin/sales/sessions/${encodeURIComponent(String(id))}/close/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Sales Invoices
  async getSalesInvoices(params?: {
    q?: string;
    channel?: string;
    status?: string;
    payment_status?: string;
    costing_status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<SalesInvoice[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<SalesInvoice[]>>(`/admin/sales/invoices/${qs}`);
  }

  async getSalesInvoice(id: string | number): Promise<SalesInvoice> {
    return this.request<SalesInvoice>(`/admin/sales/invoices/${encodeURIComponent(String(id))}/`);
  }

  async posCheckout(payload: POSCheckoutInput): Promise<SalesInvoice> {
    return this.request<SalesInvoice>("/admin/sales/invoices/pos/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createWholesaleInvoice(payload: CreateWholesaleInvoiceInput): Promise<SalesInvoice> {
    return this.request<SalesInvoice>("/admin/sales/invoices/wholesale/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async issueSalesInvoice(id: string | number): Promise<SalesInvoice> {
    return this.request<SalesInvoice>(`/admin/sales/invoices/${encodeURIComponent(String(id))}/issue/`, {
      method: "POST",
    });
  }

  async voidSalesInvoice(id: string | number, reason: string): Promise<SalesInvoice> {
    return this.request<SalesInvoice>(`/admin/sales/invoices/${encodeURIComponent(String(id))}/void/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async approveWholesaleCredit(id: string | number): Promise<SalesInvoice> {
    return this.request<SalesInvoice>(`/admin/sales/invoices/${encodeURIComponent(String(id))}/approve-credit/`, {
      method: "POST",
    });
  }

  getSalesInvoicePdfUrl(id: string | number): string {
    return `/api/v1/admin/sales/invoices/${encodeURIComponent(String(id))}/pdf/`;
  }

  // Sales Returns
  async getSalesReturns(params?: {
    q?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<SalesReturn[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<SalesReturn[]>>(`/admin/sales/returns/${qs}`);
  }

  async getSalesReturn(id: string | number): Promise<SalesReturn> {
    return this.request<SalesReturn>(`/admin/sales/returns/${encodeURIComponent(String(id))}/`);
  }

  async createSalesReturn(payload: CreateSalesReturnInput): Promise<SalesReturn> {
    return this.request<SalesReturn>("/admin/sales/returns/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async inspectSalesReturn(id: string | number, payload: InspectReturnInput): Promise<SalesReturn> {
    return this.request<SalesReturn>(`/admin/sales/returns/${encodeURIComponent(String(id))}/inspect/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async completeSalesReturn(id: string | number): Promise<SalesReturn> {
    return this.request<SalesReturn>(`/admin/sales/returns/${encodeURIComponent(String(id))}/complete/`, {
      method: "POST",
    });
  }

  async cancelSalesReturn(id: string | number, reason?: string): Promise<SalesReturn> {
    return this.request<SalesReturn>(`/admin/sales/returns/${encodeURIComponent(String(id))}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  // Credit Notes
  async getCreditNotes(params?: {
    q?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CreditNote[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<CreditNote[]>>(`/admin/sales/credit-notes/${qs}`);
  }

  async getCreditNote(id: string | number): Promise<CreditNote> {
    return this.request<CreditNote>(`/admin/sales/credit-notes/${encodeURIComponent(String(id))}/`);
  }

  async createCreditNote(payload: CreateCreditNoteInput): Promise<CreditNote> {
    return this.request<CreditNote>("/admin/sales/credit-notes/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async issueCreditNote(id: string | number): Promise<CreditNote> {
    return this.request<CreditNote>(`/admin/sales/credit-notes/${encodeURIComponent(String(id))}/issue/`, {
      method: "POST",
    });
  }

  async voidCreditNote(id: string | number, reason: string): Promise<CreditNote> {
    return this.request<CreditNote>(`/admin/sales/credit-notes/${encodeURIComponent(String(id))}/void/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // ==========================================
  // CUSTOMER MANAGEMENT & RECEIVABLES (Step 05)
  // ==========================================

  async getUsers(params?: { page?: number; search?: string }): Promise<PaginatedResponse<any[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<any[]>>(`/admin/users/${qs}`);
  }

  async getCustomerProfiles(params?: {
    q?: string;
    customer_type?: string;
    credit_status?: string;
    credit_enabled?: boolean | string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CustomerProfile[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<CustomerProfile[]>>(`/admin/customers/profiles/${qs}`);
  }

  async getCustomerProfile(id: string | number): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/`);
  }

  async createCustomerProfile(payload: {
    user_id: number;
    customer_type?: string;
    business_name?: string;
    business_contact_person?: string;
    tax_identifier?: string;
    credit_notes?: string;
  }): Promise<CustomerProfile> {
    return this.request<CustomerProfile>("/admin/customers/profiles/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateCustomerProfile(
    id: string | number,
    payload: {
      customer_type?: string;
      business_name?: string;
      business_contact_person?: string;
      tax_identifier?: string;
      credit_notes?: string;
    }
  ): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async applyCustomerCredit(
    id: string | number,
    payload: {
      requested_limit: string | number;
      payment_terms_days?: number;
      notes?: string;
    }
  ): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/apply-credit/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async approveCustomerCredit(
    id: string | number,
    payload: {
      approved_limit?: string | number;
      payment_terms_days?: number;
      notes?: string;
    }
  ): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/approve-credit/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async rejectCustomerCredit(id: string | number, reason: string): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/reject-credit/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async suspendCustomerCredit(id: string | number, reason: string): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/suspend-credit/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async updateCustomerCreditLimit(
    id: string | number,
    payload: { new_limit: string | number; reason: string }
  ): Promise<CustomerProfile> {
    return this.request<CustomerProfile>(
      `/admin/customers/profiles/${encodeURIComponent(String(id))}/update-credit-limit/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async getCustomerCreditSummary(id: string | number): Promise<CreditSummary> {
    return this.request<CreditSummary>(`/admin/customers/profiles/${encodeURIComponent(String(id))}/credit-summary/`);
  }

  async getCustomerLedger(
    id: string | number,
    params?: { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<CustomerLedgerEntry[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<CustomerLedgerEntry[]>>(
      `/admin/customers/profiles/${encodeURIComponent(String(id))}/ledger/${qs}`
    );
  }

  async getCustomerStatement(
    id: string | number,
    params?: { start_date?: string; end_date?: string }
  ): Promise<CustomerStatement> {
    const qs = this.buildQuery(params || {});
    return this.request<CustomerStatement>(
      `/admin/customers/profiles/${encodeURIComponent(String(id))}/statement/${qs}`
    );
  }

  async getCustomerPaymentAllocations(id: string | number): Promise<CustomerPaymentAllocation[]> {
    return this.request<CustomerPaymentAllocation[]>(
      `/admin/customers/profiles/${encodeURIComponent(String(id))}/payment-allocations/`
    );
  }

  async createPaymentAllocation(payload: {
    receipt_entry_id: number;
    invoice_id: number;
    amount: string | number;
    idempotency_key?: string;
  }): Promise<CustomerPaymentAllocation> {
    return this.request<CustomerPaymentAllocation>("/admin/customers/payment-allocations/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPendingCreditApplications(params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CustomerProfile[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<CustomerProfile[]>>(`/admin/customers/credit-approvals/${qs}`);
  }

  async getReceivablesSummary(): Promise<ReceivablesSummary> {
    return this.request<ReceivablesSummary>("/admin/customers/receivables/summary/");
  }

  async getReceivablesAging(params?: {
    as_of_date?: string;
    customer_id?: number | string;
  }): Promise<ReceivablesAging> {
    const qs = this.buildQuery(params || {});
    return this.request<ReceivablesAging>(`/admin/customers/receivables/aging/${qs}`);
  }

  async getOutstandingInvoices(params?: {
    customer_id?: number | string;
  }): Promise<OutstandingInvoiceSummary[]> {
    const qs = this.buildQuery(params || {});
    return this.request<OutstandingInvoiceSummary[]>(`/admin/customers/receivables/outstanding-invoices/${qs}`);
  }

  async getSupplierStatement(
    supplierId: string | number,
    params?: { start_date?: string; end_date?: string }
  ): Promise<SupplierStatement> {
    const qs = this.buildQuery(params || {});
    return this.request<SupplierStatement>(
      `/admin/procurement/suppliers/${encodeURIComponent(String(supplierId))}/statement/${qs}`
    );
  }

  // ---------------------------------------------------------------------------
  // Treasury & Settlement (Step 06)
  // ---------------------------------------------------------------------------

  async getTreasuryDashboard(): Promise<TreasuryDashboardSummary> {
    return this.request<TreasuryDashboardSummary>("/admin/treasury/dashboard/");
  }

  async getFinancialAccounts(params?: Record<string, any>): Promise<FinancialAccount[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<FinancialAccount[] | PaginatedResponse<FinancialAccount[]>>(`/admin/treasury/accounts/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<FinancialAccount[]>).results || [];
  }

  async getFinancialAccount(id: number | string): Promise<FinancialAccount> {
    return this.request<FinancialAccount>(`/admin/treasury/accounts/${id}/`);
  }

  async createFinancialAccount(payload: Partial<FinancialAccount>): Promise<FinancialAccount> {
    return this.request<FinancialAccount>("/admin/treasury/accounts/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateFinancialAccount(id: number | string, payload: Partial<FinancialAccount>): Promise<FinancialAccount> {
    return this.request<FinancialAccount>(`/admin/treasury/accounts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async getAccountCashbook(
    id: number | string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<AccountCashbookResponse> {
    const qs = this.buildQuery(params || {});
    return this.request<AccountCashbookResponse>(`/admin/treasury/accounts/${id}/cashbook/${qs}`);
  }

  async getTreasuryTransactions(params?: Record<string, any>): Promise<PaginatedResponse<FinancialAccountTransaction[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<FinancialAccountTransaction[]>>(`/admin/treasury/transactions/${qs}`);
  }

  async getAccountTransactions(accountId: number | string, params?: Record<string, any>): Promise<FinancialAccountTransaction[]> {
    const res = await this.getTreasuryTransactions({ account: accountId, ...params });
    return res.results || [];
  }

  async getFundTransfers(params?: Record<string, any>): Promise<FundTransfer[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<FundTransfer[] | PaginatedResponse<FundTransfer[]>>(`/admin/treasury/transfers/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<FundTransfer[]>).results || [];
  }

  async initiateFundTransfer(payload: {
    from_account: number;
    to_account: number;
    amount: string | number;
    reference?: string;
    external_reference?: string;
    transfer_date?: string;
  }): Promise<FundTransfer> {
    return this.request<FundTransfer>("/admin/treasury/transfers/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async approveFundTransfer(id: number | string): Promise<FundTransfer> {
    return this.request<FundTransfer>(`/admin/treasury/transfers/${id}/approve/`, {
      method: "POST",
    });
  }

  async completeFundTransfer(id: number | string): Promise<FundTransfer> {
    return this.request<FundTransfer>(`/admin/treasury/transfers/${id}/complete/`, {
      method: "POST",
    });
  }

  async rejectFundTransfer(id: number | string, reason: string): Promise<FundTransfer> {
    return this.request<FundTransfer>(`/admin/treasury/transfers/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reverseFundTransfer(id: number | string, reason: string): Promise<FundTransfer> {
    return this.request<FundTransfer>(`/admin/treasury/transfers/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getCustomerReceipts(params?: Record<string, any>): Promise<CustomerReceipt[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<CustomerReceipt[] | PaginatedResponse<CustomerReceipt[]>>(`/admin/treasury/customer-receipts/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<CustomerReceipt[]>).results || [];
  }

  async createCustomerReceipt(payload: any): Promise<CustomerReceipt> {
    return this.request<CustomerReceipt>("/admin/treasury/customer-receipts/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async verifyCustomerReceipt(id: number | string): Promise<CustomerReceipt> {
    return this.request<CustomerReceipt>(`/admin/treasury/customer-receipts/${id}/verify/`, {
      method: "POST",
    });
  }

  async cancelCustomerReceipt(id: number | string, reason: string): Promise<CustomerReceipt> {
    return this.request<CustomerReceipt>(`/admin/treasury/customer-receipts/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reverseCustomerReceipt(id: number | string, reason: string): Promise<CustomerReceipt> {
    return this.request<CustomerReceipt>(`/admin/treasury/customer-receipts/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getSupplierDisbursements(params?: Record<string, any>): Promise<SupplierDisbursement[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<SupplierDisbursement[] | PaginatedResponse<SupplierDisbursement[]>>(`/admin/treasury/supplier-disbursements/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<SupplierDisbursement[]>).results || [];
  }

  async createSupplierDisbursement(payload: any): Promise<SupplierDisbursement> {
    return this.request<SupplierDisbursement>("/admin/treasury/supplier-disbursements/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async approveSupplierDisbursement(id: number | string): Promise<SupplierDisbursement> {
    return this.request<SupplierDisbursement>(`/admin/treasury/supplier-disbursements/${id}/approve/`, {
      method: "POST",
    });
  }

  async completeSupplierDisbursement(id: number | string): Promise<SupplierDisbursement> {
    return this.request<SupplierDisbursement>(`/admin/treasury/supplier-disbursements/${id}/complete/`, {
      method: "POST",
    });
  }

  async rejectSupplierDisbursement(id: number | string, reason: string): Promise<SupplierDisbursement> {
    return this.request<SupplierDisbursement>(`/admin/treasury/supplier-disbursements/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reverseSupplierDisbursement(id: number | string, reason: string): Promise<SupplierDisbursement> {
    return this.request<SupplierDisbursement>(`/admin/treasury/supplier-disbursements/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getGatewaySettlementBatches(params?: Record<string, any>): Promise<GatewaySettlementBatch[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<GatewaySettlementBatch[] | PaginatedResponse<GatewaySettlementBatch[]>>(`/admin/treasury/settlements/gateway/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<GatewaySettlementBatch[]>).results || [];
  }

  async importGatewaySettlement(formData: FormData): Promise<GatewaySettlementBatch> {
    return this.request<GatewaySettlementBatch>("/admin/treasury/settlements/gateway/import/", {
      method: "POST",
      body: formData,
    });
  }

  async getGatewaySettlement(id: number | string): Promise<GatewaySettlementBatch> {
    return this.request<GatewaySettlementBatch>(`/admin/treasury/settlements/gateway/${id}/`);
  }

  async getGatewaySettlementLines(id: number | string): Promise<GatewaySettlementLine[]> {
    return this.request<GatewaySettlementLine[]>(`/admin/treasury/settlements/gateway/${id}/lines/`);
  }

  async confirmGatewaySettlement(id: number | string): Promise<GatewaySettlementBatch> {
    return this.request<GatewaySettlementBatch>(`/admin/treasury/settlements/gateway/${id}/confirm/`, {
      method: "POST",
    });
  }

  async reverseGatewaySettlement(id: number | string, reason: string): Promise<GatewaySettlementBatch> {
    return this.request<GatewaySettlementBatch>(`/admin/treasury/settlements/gateway/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getCourierRemittanceSheets(params?: Record<string, any>): Promise<CourierRemittanceSheet[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<CourierRemittanceSheet[] | PaginatedResponse<CourierRemittanceSheet[]>>(`/admin/treasury/settlements/courier/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<CourierRemittanceSheet[]>).results || [];
  }

  async importCourierRemittance(formData: FormData): Promise<CourierRemittanceSheet> {
    return this.request<CourierRemittanceSheet>("/admin/treasury/settlements/courier/import/", {
      method: "POST",
      body: formData,
    });
  }

  async getCourierRemittance(id: number | string): Promise<CourierRemittanceSheet> {
    return this.request<CourierRemittanceSheet>(`/admin/treasury/settlements/courier/${id}/`);
  }

  async getCourierRemittanceLines(id: number | string): Promise<CourierRemittanceLine[]> {
    return this.request<CourierRemittanceLine[]>(`/admin/treasury/settlements/courier/${id}/lines/`);
  }

  async confirmCourierRemittance(id: number | string): Promise<CourierRemittanceSheet> {
    return this.request<CourierRemittanceSheet>(`/admin/treasury/settlements/courier/${id}/confirm/`, {
      method: "POST",
    });
  }

  async reverseCourierRemittance(id: number | string, reason: string): Promise<CourierRemittanceSheet> {
    return this.request<CourierRemittanceSheet>(`/admin/treasury/settlements/courier/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getBankReconciliations(params?: Record<string, any>): Promise<BankReconciliation[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<BankReconciliation[] | PaginatedResponse<BankReconciliation[]>>(`/admin/treasury/reconciliation/bank/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<BankReconciliation[]>).results || [];
  }

  async importBankReconciliation(formData: FormData): Promise<BankReconciliation> {
    return this.request<BankReconciliation>("/admin/treasury/reconciliation/bank/import/", {
      method: "POST",
      body: formData,
    });
  }

  async getBankReconciliation(id: number | string): Promise<BankReconciliation> {
    return this.request<BankReconciliation>(`/admin/treasury/reconciliation/bank/${id}/`);
  }

  async getBankReconciliationLines(id: number | string): Promise<BankStatementLine[]> {
    return this.request<BankStatementLine[]>(`/admin/treasury/reconciliation/bank/${id}/lines/`);
  }

  async matchBankStatementLine(lineId: number | string, transactionId: number | string): Promise<BankStatementLine> {
    return this.request<BankStatementLine>("/admin/treasury/reconciliation/bank/match-line/", {
      method: "POST",
      body: JSON.stringify({ line_id: lineId, transaction_id: transactionId }),
    });
  }

  async unmatchBankStatementLine(lineId: number | string): Promise<BankStatementLine> {
    return this.request<BankStatementLine>("/admin/treasury/reconciliation/bank/unmatch-line/", {
      method: "POST",
      body: JSON.stringify({ line_id: lineId }),
    });
  }

  async finalizeBankReconciliation(id: number | string): Promise<BankReconciliation> {
    return this.request<BankReconciliation>(`/admin/treasury/reconciliation/bank/${id}/finalize/`, {
      method: "POST",
    });
  }

  async getCashCountReconciliations(params?: Record<string, any>): Promise<CashCountReconciliation[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<CashCountReconciliation[] | PaginatedResponse<CashCountReconciliation[]>>(`/admin/treasury/reconciliation/cash/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<CashCountReconciliation[]>).results || [];
  }

  async recordCashCount(payload: any): Promise<CashCountReconciliation> {
    return this.request<CashCountReconciliation>("/admin/treasury/reconciliation/cash/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async reviewCashCount(id: number | string, action: string, notes?: string): Promise<CashCountReconciliation> {
    return this.request<CashCountReconciliation>(`/admin/treasury/reconciliation/cash/${id}/review/`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    });
  }

  // -------------------------------------------------------------------------
  // Expense, Capital & Loan Management (apps.expenses - Step 07)
  // -------------------------------------------------------------------------

  // Categories
  async getExpenseCategories(params?: Record<string, any>): Promise<ExpenseCategory[]> {
    const qs = this.buildQuery(params || {});
    const res = await this.request<ExpenseCategory[] | PaginatedResponse<ExpenseCategory[]>>(`/admin/expenses/categories/${qs}`);
    if (Array.isArray(res)) return res;
    return (res as PaginatedResponse<ExpenseCategory[]>).results || [];
  }

  async createExpenseCategory(payload: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    return this.request<ExpenseCategory>("/admin/expenses/categories/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateExpenseCategory(id: number | string, payload: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    return this.request<ExpenseCategory>(`/admin/expenses/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteExpenseCategory(id: number | string): Promise<void> {
    return this.request<void>(`/admin/expenses/categories/${id}/`, {
      method: "DELETE",
    });
  }

  // Vouchers
  async getExpenseVouchers(params?: Record<string, any>): Promise<PaginatedResponse<ExpenseVoucher[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<ExpenseVoucher[]>>(`/admin/expenses/vouchers/${qs}`);
  }

  async getExpenseVoucher(id: number | string): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>(`/admin/expenses/vouchers/${id}/`);
  }

  async createExpenseVoucher(payload: any): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>("/admin/expenses/vouchers/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateExpenseVoucher(id: number | string, payload: any): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>(`/admin/expenses/vouchers/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async submitExpenseVoucher(id: number | string): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>(`/admin/expenses/vouchers/${id}/submit/`, {
      method: "POST",
    });
  }

  async approveExpenseVoucher(id: number | string): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>(`/admin/expenses/vouchers/${id}/approve/`, {
      method: "POST",
    });
  }

  async rejectExpenseVoucher(id: number | string, reason: string): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>(`/admin/expenses/vouchers/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async cancelExpenseVoucher(id: number | string, reason?: string): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>(`/admin/expenses/vouchers/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async disburseExpenseVoucher(id: number | string, payload: any): Promise<ExpenseDisbursement> {
    return this.request<ExpenseDisbursement>(`/admin/expenses/vouchers/${id}/disburse/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async uploadVoucherAttachment(id: number | string, formData: FormData): Promise<ExpenseVoucherAttachment> {
    return this.request<ExpenseVoucherAttachment>(`/admin/expenses/vouchers/${id}/attachments/`, {
      method: "POST",
      body: formData,
    });
  }

  async deleteVoucherAttachment(voucherId: number | string, attachmentId: number | string): Promise<void> {
    return this.request<void>(`/admin/expenses/vouchers/${voucherId}/attachments/${attachmentId}/`, {
      method: "DELETE",
    });
  }

  // Disbursements
  async getExpenseDisbursements(params?: Record<string, any>): Promise<PaginatedResponse<ExpenseDisbursement[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<ExpenseDisbursement[]>>(`/admin/expenses/disbursements/${qs}`);
  }

  async reverseExpenseDisbursement(id: number | string, reason?: string): Promise<ExpenseDisbursement> {
    return this.request<ExpenseDisbursement>(`/admin/expenses/disbursements/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  // Capital Contributions
  async getCapitalContributions(params?: Record<string, any>): Promise<PaginatedResponse<CapitalContribution[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<CapitalContribution[]>>(`/admin/expenses/capital/${qs}`);
  }

  async getCapitalContribution(id: number | string): Promise<CapitalContribution> {
    return this.request<CapitalContribution>(`/admin/expenses/capital/${id}/`);
  }

  async createCapitalContribution(payload: any): Promise<CapitalContribution> {
    return this.request<CapitalContribution>("/admin/expenses/capital/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async verifyCapitalContribution(id: number | string, payload?: any): Promise<CapitalContribution> {
    return this.request<CapitalContribution>(`/admin/expenses/capital/${id}/verify/`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  async cancelCapitalContribution(id: number | string, reason?: string): Promise<CapitalContribution> {
    return this.request<CapitalContribution>(`/admin/expenses/capital/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async reverseCapitalContribution(id: number | string, reason?: string): Promise<CapitalContribution> {
    return this.request<CapitalContribution>(`/admin/expenses/capital/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  // Loans
  async getLoanContracts(params?: Record<string, any>): Promise<PaginatedResponse<LoanContract[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<LoanContract[]>>(`/admin/expenses/loans/${qs}`);
  }

  async getLoanContract(id: number | string): Promise<LoanContract> {
    return this.request<LoanContract>(`/admin/expenses/loans/${id}/`);
  }

  async createLoanContract(payload: any): Promise<LoanContract> {
    return this.request<LoanContract>("/admin/expenses/loans/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateLoanContract(id: number | string, payload: any): Promise<LoanContract> {
    return this.request<LoanContract>(`/admin/expenses/loans/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async receiveLoanProceeds(id: number | string, payload: any): Promise<LoanContract> {
    return this.request<LoanContract>(`/admin/expenses/loans/${id}/receive-proceeds/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async generateLoanSchedule(id: number | string, installments: any[]): Promise<LoanRepaymentSchedule[]> {
    return this.request<LoanRepaymentSchedule[]>(`/admin/expenses/loans/${id}/generate-schedule/`, {
      method: "POST",
      body: JSON.stringify({ installments }),
    });
  }

  async repayLoan(id: number | string, payload: any): Promise<LoanRepayment> {
    return this.request<LoanRepayment>(`/admin/expenses/loans/${id}/repay/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getLoanRepayments(params?: Record<string, any>): Promise<PaginatedResponse<LoanRepayment[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<LoanRepayment[]>>(`/admin/expenses/loan-repayments/${qs}`);
  }

  async reverseLoanRepayment(id: number | string, reason?: string): Promise<LoanRepayment> {
    return this.request<LoanRepayment>(`/admin/expenses/loan-repayments/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  // Owner Drawings
  async getOwnerDrawings(params?: Record<string, any>): Promise<PaginatedResponse<OwnerDrawing[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<OwnerDrawing[]>>(`/admin/expenses/drawings/${qs}`);
  }

  async getOwnerDrawing(id: number | string): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/`);
  }

  async createOwnerDrawing(payload: any): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>("/admin/expenses/drawings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async submitOwnerDrawing(id: number | string): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/submit/`, {
      method: "POST",
    });
  }

  async approveOwnerDrawing(id: number | string): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/approve/`, {
      method: "POST",
    });
  }

  async disburseOwnerDrawing(id: number | string, payload?: any): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/disburse/`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  }

  async rejectOwnerDrawing(id: number | string, reason?: string): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async cancelOwnerDrawing(id: number | string, reason?: string): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async reverseOwnerDrawing(id: number | string, reason?: string): Promise<OwnerDrawing> {
    return this.request<OwnerDrawing>(`/admin/expenses/drawings/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  // Reports
  async getExpenseDashboard(params?: Record<string, any>): Promise<ExpenseDashboardMetrics> {
    const qs = this.buildQuery(params || {});
    return this.request<ExpenseDashboardMetrics>(`/admin/expenses/dashboard/${qs}`);
  }

  async getExpenseCategoryBreakdown(params?: Record<string, any>): Promise<ExpenseCategoryBreakdownItem[]> {
    const qs = this.buildQuery(params || {});
    return this.request<ExpenseCategoryBreakdownItem[]>(`/admin/expenses/reports/categories/${qs}`);
  }

  async getFinanceSummary(params?: Record<string, any>): Promise<FinanceSummary> {
    const qs = this.buildQuery(params || {});
    return this.request<FinanceSummary>(`/admin/expenses/reports/finance-summary/${qs}`);
  }

  // =========================================================================
  // Double-Entry Accounting & General Ledger (Step 08)
  // =========================================================================

  // Chart of Accounts
  async getAccounts(params?: Record<string, any>): Promise<PaginatedResponse<Account[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<Account[]>>(`/admin/accounting/accounts/${qs}`);
  }

  async getAccount(id: number | string): Promise<Account> {
    return this.request<Account>(`/admin/accounting/accounts/${id}/`);
  }

  async getAccountTree(params?: Record<string, any>): Promise<AccountTreeNode[]> {
    const qs = this.buildQuery(params || {});
    return this.request<AccountTreeNode[]>(`/admin/accounting/accounts/tree/${qs}`);
  }

  async createAccount(payload: AccountCreatePayload): Promise<Account> {
    return this.request<Account>("/admin/accounting/accounts/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateAccount(id: number | string, payload: AccountUpdatePayload): Promise<Account> {
    return this.request<Account>(`/admin/accounting/accounts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deactivateAccount(id: number | string): Promise<{ success: boolean; message: string; account: Account }> {
    return this.request<{ success: boolean; message: string; account: Account }>(
      `/admin/accounting/accounts/${id}/deactivate/`,
      {
        method: "POST",
      }
    );
  }

  async deleteAccount(id: number | string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/accounting/accounts/${id}/`, {
      method: "DELETE",
    });
  }

  async getAccountActivity(id: number | string, params?: Record<string, any>): Promise<any> {
    const qs = this.buildQuery(params || {});
    return this.request<any>(`/admin/accounting/accounts/${id}/activity/${qs}`);
  }

  // Journal Entries
  async getJournals(params?: Record<string, any>): Promise<PaginatedResponse<JournalEntry[]>> {
    const qs = this.buildQuery(params || {});
    return this.request<PaginatedResponse<JournalEntry[]>>(`/admin/accounting/journals/${qs}`);
  }

  async getJournal(id: number | string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/`);
  }

  async createJournal(payload: JournalEntryCreatePayload): Promise<JournalEntry> {
    return this.request<JournalEntry>("/admin/accounting/journals/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateJournal(id: number | string, payload: JournalEntryUpdatePayload): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async submitJournal(id: number | string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/submit/`, {
      method: "POST",
    });
  }

  async approveJournal(id: number | string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/approve/`, {
      method: "POST",
    });
  }

  async rejectJournal(id: number | string, reason?: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async cancelJournal(id: number | string, reason?: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/cancel/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async postJournal(id: number | string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/post/`, {
      method: "POST",
    });
  }

  async reverseJournal(id: number | string, reason: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/admin/accounting/journals/${id}/reverse/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Accounting Periods Control
  async getLedgerPeriods(params?: Record<string, any>): Promise<PaginatedResponse<AccountingPeriodInfo[]> | AccountingPeriodInfo[]> {
    const qs = this.buildQuery(params || {});
    return this.request<any>(`/admin/accounting/periods/${qs}`);
  }

  async getLedgerPeriod(id: number | string): Promise<AccountingPeriodInfo> {
    return this.request<AccountingPeriodInfo>(`/admin/accounting/periods/${id}/`);
  }

  async lockAccountingPeriod(id: number | string, reason?: string): Promise<AccountingPeriodInfo> {
    return this.request<AccountingPeriodInfo>(`/admin/accounting/periods/${id}/lock/`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "" }),
    });
  }

  async reopenAccountingPeriod(id: number | string, reason: string): Promise<AccountingPeriodInfo> {
    return this.request<AccountingPeriodInfo>(`/admin/accounting/periods/${id}/reopen/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getPeriodReadiness(id: number | string): Promise<PeriodReadinessReport> {
    return this.request<PeriodReadinessReport>(`/admin/accounting/periods/${id}/readiness/`);
  }

  // Reports & Dashboard
  async getTrialBalance(params?: Record<string, any>): Promise<TrialBalanceReport> {
    const qs = this.buildQuery(params || {});
    return this.request<TrialBalanceReport>(`/admin/accounting/reports/trial-balance/${qs}`);
  }

  async getGeneralLedger(params?: Record<string, any>): Promise<GeneralLedgerReport> {
    const qs = this.buildQuery(params || {});
    return this.request<GeneralLedgerReport>(`/admin/accounting/reports/general-ledger/${qs}`);
  }

  async getAccountingDashboard(params?: Record<string, any>): Promise<AccountingDashboardMetrics> {
    const qs = this.buildQuery(params || {});
    return this.request<AccountingDashboardMetrics>(`/admin/accounting/dashboard/${qs}`);
  }

  // ==========================================
  // Commercial Events & GL Synchronization (Step 09)
  // ==========================================

  async getEventQueue(params?: Record<string, any>): Promise<PaginatedResponse<AccountingEvent> | AccountingEvent[]> {
    const qs = this.buildQuery(params || {});
    return this.request<any>(`/admin/events/queue/${qs}`);
  }

  async getEvent(id: number | string): Promise<AccountingEvent> {
    return this.request<AccountingEvent>(`/admin/events/queue/${id}/`);
  }

  async retryEvent(id: number | string): Promise<{ success: boolean; message: string; journal_id?: number; event: AccountingEvent }> {
    return this.request<any>(`/admin/events/queue/${id}/retry/`, {
      method: "POST",
    });
  }

  async ignoreEvent(id: number | string, reason: string): Promise<{ success: boolean; message: string; event: AccountingEvent }> {
    return this.request<any>(`/admin/events/queue/${id}/ignore/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getEventStats(): Promise<EventQueueStats> {
    return this.request<EventQueueStats>(`/admin/events/queue/stats/`);
  }

  async triggerBatchProcess(params?: { batch_size?: number; event_type?: string; source_module?: string }): Promise<any> {
    return this.request<any>(`/admin/events/queue/batch_process/`, {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  }

  async getEventMappings(params?: Record<string, any>): Promise<PaginatedResponse<AccountingEventMapping> | AccountingEventMapping[]> {
    const qs = this.buildQuery(params || {});
    return this.request<any>(`/admin/events/mappings/${qs}`);
  }

  async getEventMapping(id: number | string): Promise<AccountingEventMapping> {
    return this.request<AccountingEventMapping>(`/admin/events/mappings/${id}/`);
  }

  async createEventMapping(data: any): Promise<AccountingEventMapping> {
    return this.request<AccountingEventMapping>(`/admin/events/mappings/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getEventMappingVersions(id: number | string): Promise<AccountingEventMappingVersion[]> {
    return this.request<AccountingEventMappingVersion[]>(`/admin/events/mappings/${id}/versions/`);
  }

  async createEventMappingVersion(mappingId: number | string, data: any): Promise<AccountingEventMappingVersion> {
    return this.request<AccountingEventMappingVersion>(`/admin/events/mappings/${mappingId}/create_version/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async submitEventMappingVersion(versionId: number): Promise<AccountingEventMappingVersion> {
    return this.request<AccountingEventMappingVersion>(`/admin/events/mappings/submit_version/`, {
      method: "POST",
      body: JSON.stringify({ version_id: versionId }),
    });
  }

  async approveEventMappingVersion(versionId: number): Promise<AccountingEventMappingVersion> {
    return this.request<AccountingEventMappingVersion>(`/admin/events/mappings/approve_version/`, {
      method: "POST",
      body: JSON.stringify({ version_id: versionId }),
    });
  }

  async activateEventMappingVersion(versionId: number): Promise<AccountingEventMappingVersion> {
    return this.request<AccountingEventMappingVersion>(`/admin/events/mappings/activate_version/`, {
      method: "POST",
      body: JSON.stringify({ version_id: versionId }),
    });
  }

  async retireEventMappingVersion(versionId: number): Promise<AccountingEventMappingVersion> {
    return this.request<AccountingEventMappingVersion>(`/admin/events/mappings/retire_version/`, {
      method: "POST",
      body: JSON.stringify({ version_id: versionId }),
    });
  }

  async previewEventMapping(data: {
    event_type: string;
    payload: Record<string, any>;
    mapping_version_id?: number;
    accounting_date?: string;
    currency?: string;
  }): Promise<DryRunPreviewResult> {
    return this.request<DryRunPreviewResult>(`/admin/events/mappings/preview/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTreasuryMappings(params?: Record<string, any>): Promise<PaginatedResponse<TreasuryAccountMapping> | TreasuryAccountMapping[]> {
    const qs = this.buildQuery(params || {});
    return this.request<any>(`/admin/events/treasury-mappings/${qs}`);
  }

  async setTreasuryMapping(data: {
    financial_account_id: number;
    accounting_account_id: number;
    notes?: string;
    is_active?: boolean;
  }): Promise<TreasuryAccountMapping> {
    return this.request<TreasuryAccountMapping>(`/admin/events/treasury-mappings/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getExpenseCategoryMappings(params?: Record<string, any>): Promise<PaginatedResponse<ExpenseCategoryAccountMapping> | ExpenseCategoryAccountMapping[]> {
    const qs = this.buildQuery(params || {});
    return this.request<any>(`/admin/events/expense-mappings/${qs}`);
  }

  async setExpenseCategoryMapping(data: {
    expense_category_id: number;
    accounting_account_id: number;
    is_active?: boolean;
  }): Promise<ExpenseCategoryAccountMapping> {
    return this.request<ExpenseCategoryAccountMapping>(`/admin/events/expense-mappings/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getReconciliationReport(subledger?: string): Promise<any> {
    const endpoint = subledger ? `/admin/events/reconciliation/${subledger}/` : `/admin/events/reconciliation/`;
    return this.request<any>(endpoint);
  }

  // ==========================================
  // FINANCIAL REPORTING (STEP 10)
  // ==========================================
  async getReportingDashboard(): Promise<import("@/types/reporting").ReportingDashboardData> {
    return this.request<import("@/types/reporting").ReportingDashboardData>(`/admin/reporting/dashboard/`);
  }

  async getProfitLoss(params?: Record<string, any>): Promise<import("@/types/reporting").ProfitLossResponse> {
    const qs = this.buildQuery(params || {});
    return this.request<import("@/types/reporting").ProfitLossResponse>(`/admin/reporting/profit-loss/${qs}`);
  }

  async getBalanceSheet(params?: Record<string, any>): Promise<import("@/types/reporting").BalanceSheetResponse> {
    const qs = this.buildQuery(params || {});
    return this.request<import("@/types/reporting").BalanceSheetResponse>(`/admin/reporting/balance-sheet/${qs}`);
  }

  async getCashFlow(params?: Record<string, any>): Promise<import("@/types/reporting").CashFlowResponse> {
    const qs = this.buildQuery(params || {});
    return this.request<import("@/types/reporting").CashFlowResponse>(`/admin/reporting/cash-flow/${qs}`);
  }

  async getComparativeStatement(params?: Record<string, any>): Promise<import("@/types/reporting").ComparativeResponse> {
    const qs = this.buildQuery(params || {});
    return this.request<import("@/types/reporting").ComparativeResponse>(`/admin/reporting/comparative/${qs}`);
  }

  async getReportingValidation(params?: Record<string, any>): Promise<import("@/types/reporting").ReportingValidationResponse> {
    const qs = this.buildQuery(params || {});
    return this.request<import("@/types/reporting").ReportingValidationResponse>(`/admin/reporting/validation/${qs}`);
  }

  async drilldownStatementLine(code: string, params?: Record<string, any>): Promise<import("@/types/reporting").StatementLineDrillDownResponse> {
    const allParams = { code, ...(params || {}) };
    const qs = this.buildQuery(allParams);
    return this.request<import("@/types/reporting").StatementLineDrillDownResponse>(`/admin/reporting/drill-down/line/${qs}`);
  }

  async drilldownJournal(journalId: number): Promise<any> {
    return this.request<any>(`/admin/reporting/drill-down/journal/${journalId}/`);
  }

  async getFinancialStatements(): Promise<any[]> {
    return this.request<any[]>(`/admin/reporting/statements/`);
  }

  async getFinancialStatementLines(statementType?: string): Promise<import("@/types/reporting").StatementLineItem[]> {
    const qs = statementType ? `?statement_type=${encodeURIComponent(statementType)}` : "";
    return this.request<import("@/types/reporting").StatementLineItem[]>(`/admin/reporting/statement-lines/${qs}`);
  }

  async getAccountStatementMappings(params?: Record<string, any>): Promise<import("@/types/reporting").AccountStatementMappingItem[]> {
    const qs = this.buildQuery(params || {});
    return this.request<import("@/types/reporting").AccountStatementMappingItem[]>(`/admin/reporting/account-mappings/${qs}`);
  }

  async createAccountStatementMapping(data: {
    account_id: number;
    statement_line_id: number;
    effective_from?: string | null;
    effective_to?: string | null;
    notes?: string;
  }): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.request<import("@/types/reporting").AccountStatementMappingItem>(`/admin/reporting/account-mappings/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async submitAccountStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.request<import("@/types/reporting").AccountStatementMappingItem>(`/admin/reporting/account-mappings/${id}/submit/`, {
      method: "POST",
    });
  }

  async approveAccountStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.request<import("@/types/reporting").AccountStatementMappingItem>(`/admin/reporting/account-mappings/${id}/approve/`, {
      method: "POST",
    });
  }

  async rejectAccountStatementMapping(id: number, reason: string): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.request<import("@/types/reporting").AccountStatementMappingItem>(`/admin/reporting/account-mappings/${id}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async activateAccountStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.request<import("@/types/reporting").AccountStatementMappingItem>(`/admin/reporting/account-mappings/${id}/activate/`, {
      method: "POST",
    });
  }

  async retireAccountStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.request<import("@/types/reporting").AccountStatementMappingItem>(`/admin/reporting/account-mappings/${id}/retire/`, {
      method: "POST",
    });
  }

  async getCashFlowMappings(): Promise<import("@/types/reporting").CashFlowAccountMappingItem[]> {
    return this.request<import("@/types/reporting").CashFlowAccountMappingItem[]>(`/admin/reporting/cash-flow-mappings/`);
  }

  async setCashFlowMapping(data: {
    account_id: number;
    is_cash_equivalent: boolean;
    default_activity: string;
    notes?: string;
  }): Promise<import("@/types/reporting").CashFlowAccountMappingItem> {
    return this.request<import("@/types/reporting").CashFlowAccountMappingItem>(`/admin/reporting/cash-flow-mappings/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getReportingConfig(): Promise<any> {
    return this.request<any>(`/admin/reporting/configuration/`);
  }

  async updateReportingConfig(data: any): Promise<any> {
    return this.request<any>(`/admin/reporting/configuration/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getReportSnapshots(reportType?: string): Promise<import("@/types/reporting").ReportSnapshotItem[]> {
    const qs = reportType ? `?report_type=${encodeURIComponent(reportType)}` : "";
    return this.request<import("@/types/reporting").ReportSnapshotItem[]>(`/admin/reporting/snapshots/${qs}`);
  }

  async createReportSnapshot(data: {
    report_type?: string;
    statement_type?: string;
    title?: string;
    name?: string;
    notes?: string;
    fiscal_year_id?: number | null;
    period_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    as_of_date?: string | null;
  }): Promise<import("@/types/reporting").ReportSnapshotItem> {
    const payload = {
      ...data,
      report_type: data.report_type || data.statement_type || "balance_sheet",
      name: data.name || data.title || "Report Snapshot",
    };
    return this.request<import("@/types/reporting").ReportSnapshotItem>(`/admin/reporting/snapshots/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getReportSnapshot(id: number): Promise<import("@/types/reporting").ReportSnapshotItem> {
    return this.request<import("@/types/reporting").ReportSnapshotItem>(`/admin/reporting/snapshots/${id}/`);
  }

  async finalizeReportSnapshot(id: number): Promise<import("@/types/reporting").ReportSnapshotItem> {
    return this.request<import("@/types/reporting").ReportSnapshotItem>(`/admin/reporting/snapshots/${id}/finalize/`, {
      method: "POST",
    });
  }

  async getFinancialDashboard(): Promise<import("@/types/reporting").ReportingDashboardData> {
    return this.getReportingDashboard();
  }

  async getCashFlowAccountMappings(): Promise<import("@/types/reporting").CashFlowAccountMappingItem[]> {
    return this.getCashFlowMappings();
  }

  async submitStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.submitAccountStatementMapping(id);
  }

  async approveStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.approveAccountStatementMapping(id);
  }

  async rejectStatementMapping(id: number, reason: string): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.rejectAccountStatementMapping(id, reason);
  }

  async activateStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.activateAccountStatementMapping(id);
  }

  async retireStatementMapping(id: number): Promise<import("@/types/reporting").AccountStatementMappingItem> {
    return this.retireAccountStatementMapping(id);
  }

  async getReportSnapshotDetail(id: number): Promise<import("@/types/reporting").ReportSnapshotItem> {
    return this.getReportSnapshot(id);
  }

  async validateFinancialReporting(): Promise<import("@/types/reporting").ReportingValidationResponse> {
    return this.request<import("@/types/reporting").ReportingValidationResponse>(`/admin/reporting/validation/`);
  }

  async autoMapChartOfAccounts(): Promise<{ success: boolean; message: string; created?: number; activated?: number }> {
    return this.request<{ success: boolean; message: string; created?: number; activated?: number }>(`/admin/reporting/account-mappings/auto-map/`, {
      method: "POST",
    });
  }

  async getStatementLines(statementType?: string): Promise<import("@/types/reporting").StatementLineItem[]> {
    const qs = statementType ? `?statement_type=${statementType}` : "";
    return this.request<import("@/types/reporting").StatementLineItem[]>(`/admin/reporting/statement-lines/${qs}`);
  }

  async getChartOfAccounts(): Promise<any[]> {
    return this.request<any[]>(`/admin/accounting/accounts/`);
  }

  async exportFinancialStatement(
    statementTypeOrFormat: string,
    formatOrParams?: "csv" | "pdf" | Record<string, any>,
    maybeParams?: Record<string, any>
  ): Promise<Blob> {
    let statementType: string;
    let format: string;
    let params: Record<string, any> = {};

    if (statementTypeOrFormat === "csv" || statementTypeOrFormat === "pdf") {
      format = statementTypeOrFormat;
      const opts = (formatOrParams as Record<string, any>) || {};
      statementType = opts.statement_type || "profit_and_loss";
      params = opts;
    } else {
      statementType = statementTypeOrFormat;
      format = (formatOrParams as string) || "csv";
      params = maybeParams || {};
    }

    const qs = this.buildAnalyticsQuery({ ...params, format });
    const response = await fetch(`${this.baseUrl}/admin/reporting/${statementType}/export/${qs}`, {
      headers: this.getAuthHeaders(),
    });
    return response.blob();
  }

  // ==========================================
  // Step 11: Business Analytics & Decision-Support
  // ==========================================

  private buildAnalyticsQuery(params?: Record<string, any>): string {
    if (!params) return "";
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        clean[k] = String(v);
      }
    }
    const q = new URLSearchParams(clean).toString();
    return q ? `?${q}` : "";
  }

  async getExecutiveDashboard(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").ExecutiveDashboardData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").ExecutiveDashboardData>(`/admin/analytics/executive/${qs}`);
  }

  async getSalesAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").SalesAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").SalesAnalyticsData>(`/admin/analytics/sales/${qs}`);
  }

  async getProductAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").ProductAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").ProductAnalyticsData>(`/admin/analytics/products/${qs}`);
  }

  async getInventoryAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").InventoryAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").InventoryAnalyticsData>(`/admin/analytics/inventory/${qs}`);
  }

  async getProcurementAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").ProcurementAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").ProcurementAnalyticsData>(`/admin/analytics/procurement/${qs}`);
  }

  async getCustomerAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").CustomerAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").CustomerAnalyticsData>(`/admin/analytics/customers/${qs}`);
  }

  async getTreasuryAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").TreasuryAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").TreasuryAnalyticsData>(`/admin/analytics/treasury/${qs}`);
  }

  async getExpenseAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").ExpenseAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").ExpenseAnalyticsData>(`/admin/analytics/expenses/${qs}`);
  }

  async getTrendAnalytics(params?: { preset?: string; start_date?: string; end_date?: string }): Promise<import("@/types/analytics").TrendAnalyticsData> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").TrendAnalyticsData>(`/admin/analytics/trends/${qs}`);
  }

  async getAnalyticsMetricDefinitions(): Promise<import("@/types/analytics").MetricDefinition[]> {
    return this.request<import("@/types/analytics").MetricDefinition[]>(`/admin/analytics/metrics/`);
  }

  async getAlertRecords(params?: { status?: string; severity?: string; domain?: string }): Promise<import("@/types/analytics").AlertRecord[]> {
    const qs = this.buildAnalyticsQuery(params);
    return this.request<import("@/types/analytics").AlertRecord[]>(`/admin/analytics/alerts/${qs}`);
  }

  async getAlertRecord(id: number): Promise<import("@/types/analytics").AlertRecord> {
    return this.request<import("@/types/analytics").AlertRecord>(`/admin/analytics/alerts/${id}/`);
  }

  async acknowledgeAlert(id: number, notes?: string): Promise<import("@/types/analytics").AlertRecord> {
    return this.request<import("@/types/analytics").AlertRecord>(`/admin/analytics/alerts/${id}/acknowledge/`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async resolveAlert(id: number, notes?: string): Promise<import("@/types/analytics").AlertRecord> {
    return this.request<import("@/types/analytics").AlertRecord>(`/admin/analytics/alerts/${id}/resolve/`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async dismissAlert(id: number, notes?: string): Promise<import("@/types/analytics").AlertRecord> {
    return this.request<import("@/types/analytics").AlertRecord>(`/admin/analytics/alerts/${id}/dismiss/`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async getAlertRules(): Promise<import("@/types/analytics").AlertRule[]> {
    return this.request<import("@/types/analytics").AlertRule[]>(`/admin/analytics/alert-rules/`);
  }

  async updateAlertRule(id: number, data: Partial<import("@/types/analytics").AlertRule>): Promise<import("@/types/analytics").AlertRule> {
    return this.request<import("@/types/analytics").AlertRule>(`/admin/analytics/alert-rules/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const adminApi = new AdminApiClient();
