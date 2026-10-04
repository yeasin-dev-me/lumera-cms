export interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  permissions: string[];
}

export interface AdminApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "unavailable";
}

export interface DashboardMetricSummary {
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  revenueSnapshot: string;
  health: "ok" | "degraded" | "unavailable";
}

export interface StaffLoginPayload {
  email: string;
  password: string;
}

export interface StaffAuthResponse {
  access: string;
  refresh: string;
  user: StaffUser;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}
