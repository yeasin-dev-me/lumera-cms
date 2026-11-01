/**
 * TypeScript interfaces for Product & Inventory Management (apps.inventory - Step 02)
 */

export type StockMovementType =
  | "opening_stock"
  | "purchase_received"
  | "sales_dispatch"
  | "sales_return"
  | "purchase_return"
  | "adjustment_in"
  | "adjustment_out"
  | "scrap"
  | "damage"
  | "expired"
  | "internal_transfer";

export type StockAdjustmentStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled";

export type StockAdjustmentReason =
  | "physical_count"
  | "damage"
  | "spoilage"
  | "expiry"
  | "theft"
  | "data_correction"
  | "opening_balance";

export type ExpiryStatus = "expired" | "critical" | "warning" | "fresh" | "unknown";

export interface GlobalInventoryMetrics {
  total_products: number;
  total_stock_units: number;
  reconciled_products: number;
  unreconciled_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  expired_batches: number;
  critical_batches: number;
}

export interface StockSummaryItem {
  product_id: number;
  product_public_id: string;
  product_name: string;
  sku: string;
  cached_stock_quantity: number;
  ledger_total_quantity: number;
  discrepancy_quantity: number;
  is_reconciled: boolean;
  has_legacy_discrepancy: boolean;
  cost_layer_quantity: number;
  has_unverified_valuation: boolean;
  batch_count: number;
  expired_batch_count: number;
  critical_expiry_count: number;
  warning_expiry_count: number;
  unknown_expiry_count: number;
}

export interface StockSummaryResponse {
  metrics: GlobalInventoryMetrics;
  items: StockSummaryItem[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
}

export interface StockMovement {
  id: number;
  public_id: string;
  product: number;
  product_name: string;
  product_sku: string;
  movement_type: StockMovementType;
  quantity_delta: number;
  unit_cost: string | null;
  total_cost: string | null;
  batch_lot: number | null;
  batch_number: string | null;
  source_type: string;
  source_id: string;
  created_by: number | null;
  created_by_email: string | null;
  notes: string;
  created_at: string;
}

export interface BatchLot {
  id: number;
  public_id: string;
  product: number;
  product_name: string;
  product_sku: string;
  batch_number: string;
  manufacture_date: string | null;
  expiry_date: string | null;
  notes: string;
  is_active: boolean;
  days_until_expiry: number | null;
  expiry_status: ExpiryStatus;
  created_at: string;
  updated_at: string;
}

export interface BatchLotCreatePayload {
  product: number;
  batch_number: string;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  notes?: string;
  is_active?: boolean;
}

export interface CostLayer {
  id: number;
  public_id: string;
  product: number;
  product_name: string;
  product_sku: string;
  batch_lot: number | null;
  batch_number: string | null;
  receipt_date: string;
  initial_quantity: number;
  remaining_quantity: number;
  unit_cost: string;
  is_depleted: boolean;
  source_type: string;
  source_id: string;
  created_at: string;
}

export interface StockAdjustmentItem {
  id: number;
  public_id: string;
  product: number;
  product_name: string;
  product_sku: string;
  batch_lot: number | null;
  batch_number: string | null;
  system_quantity: number;
  counted_quantity: number;
  variance_quantity: number;
  unit_cost: string | null;
  notes: string;
  created_at: string;
}

export interface StockAdjustmentItemInput {
  product_id: number;
  batch_lot_id?: number | null;
  counted_quantity: number;
  unit_cost?: string | number | null;
  notes?: string;
}

export interface StockAdjustment {
  id: number;
  public_id: string;
  adjustment_number: string;
  status: StockAdjustmentStatus;
  reason: StockAdjustmentReason;
  notes: string;
  created_by: number | null;
  created_by_email: string | null;
  approved_by: number | null;
  approved_by_email: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  items_count: number;
  total_variance_quantity: number;
  items: StockAdjustmentItem[];
  created_at: string;
  updated_at: string;
}

export interface StockAdjustmentCreatePayload {
  reason: StockAdjustmentReason | string;
  notes?: string;
  items?: StockAdjustmentItemInput[];
}

