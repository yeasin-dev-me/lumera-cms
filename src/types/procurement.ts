/**
 * TypeScript interfaces for Procurement & Supplier Management (apps.procurement - Step 03)
 */

export type PurchaseOrderStatus =
  | "draft"
  | "confirmed"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseReceiptStatus = "received" | "cancelled";

export type PurchaseInspectionStatus = "pending" | "passed" | "rejected" | "partial";

export type PurchaseBillStatus = "draft" | "posted" | "cancelled";

export type LandedCostAllocationMethod = "value" | "weight";

export type LandedCostCategory = "freight" | "customs" | "clearing" | "other";

export interface Supplier {
  id: number;
  public_id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  payment_terms_days: number;
  is_active: boolean;
  created_by?: number;
  created_by_email?: string | null;
  orders_count?: number;
  bills_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierInput {
  code?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  payment_terms_days?: number;
  is_active?: boolean;
}

export interface PurchaseOrderItem {
  id: number;
  public_id: string;
  product: number;
  product_name: string;
  product_sku: string;
  product_name_snapshot: string;
  product_sku_snapshot: string;
  ordered_quantity: number;
  unit_price: string;
  line_total: string;
  received_quantity: number;
  remaining_quantity: number;
  notes: string;
  created_at: string;
}

export interface PurchaseOrderItemInput {
  product_id: number;
  ordered_quantity: number;
  unit_price: string | number;
  notes?: string;
}

export interface PurchaseOrder {
  id: number;
  public_id: string;
  po_number: string;
  supplier: number;
  supplier_name: string;
  supplier_code: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: PurchaseOrderStatus;
  subtotal: string;
  items_count: number;
  total_ordered_quantity: number;
  total_received_quantity: number;
  items: PurchaseOrderItem[];
  notes: string;
  created_by?: number;
  created_by_email?: string | null;
  approved_by?: number | null;
  approved_by_email?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderInput {
  supplier_id: number;
  order_date: string;
  expected_delivery_date?: string | null;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export interface PurchaseReceiptItem {
  id: number;
  public_id: string;
  po_item: number;
  product: number;
  product_name: string;
  product_sku: string;
  ordered_quantity_snapshot: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  batch_number: string;
  manufacture_date: string | null;
  expiry_date: string | null;
  inspection_status: PurchaseInspectionStatus;
  rejection_reason: string;
  billed_quantity: number;
  unbilled_quantity: number;
  created_at: string;
}

export interface PurchaseReceiptItemInput {
  po_item_id: number;
  accepted_quantity: number;
  rejected_quantity?: number;
  batch_number?: string;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  rejection_reason?: string;
}

export interface PurchaseReceipt {
  id: number;
  public_id: string;
  receipt_number: string;
  purchase_order: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  receipt_date: string;
  delivery_note_ref: string;
  status: PurchaseReceiptStatus;
  received_by?: number;
  received_by_email?: string | null;
  items_count: number;
  total_received_quantity: number;
  total_accepted_quantity: number;
  total_rejected_quantity: number;
  items: PurchaseReceiptItem[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseReceiptInput {
  purchase_order_id: number;
  receipt_date: string;
  delivery_note_ref?: string;
  notes?: string;
  items: PurchaseReceiptItemInput[];
}

export interface LandedCostAllocation {
  id: number;
  public_id: string;
  purchase_bill: number;
  bill_item: number;
  product_sku: string;
  allocation_method: LandedCostAllocationMethod;
  cost_category: LandedCostCategory;
  ratio: string;
  allocated_amount: string;
  created_at: string;
}

export interface PurchaseBillItem {
  id: number;
  public_id: string;
  receipt_item?: number | null;
  product: number;
  product_name: string;
  product_sku: string;
  billed_quantity: number;
  raw_unit_cost: string;
  raw_line_total: string;
  allocation_weight: string | null;
  allocated_landed_cost: string;
  landed_line_total: string;
  landed_unit_cost: string;
  batch_number: string;
  manufacture_date: string | null;
  expiry_date: string | null;
  notes: string;
  created_at: string;
}

export interface PurchaseBillItemInput {
  product_id?: number;
  receipt_item_id?: number | null;
  billed_quantity: number;
  raw_unit_cost: string | number;
  allocation_weight?: string | number | null;
  batch_number?: string;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  notes?: string;
}

export interface PurchaseBill {
  id: number;
  public_id: string;
  bill_number: string;
  supplier: number;
  supplier_name: string;
  supplier_code: string;
  supplier_invoice_ref: string;
  purchase_order?: number | null;
  po_number?: string | null;
  bill_date: string;
  due_date: string;
  subtotal: string;
  freight_charges: string;
  customs_duties: string;
  clearing_charges: string;
  other_landed_costs: string;
  total_landed_costs: string;
  total_amount: string;
  status: PurchaseBillStatus;
  created_by?: number;
  created_by_email?: string | null;
  posted_by?: number | null;
  posted_by_email?: string | null;
  posted_at?: string | null;
  items_count: number;
  total_billed_quantity: number;
  items: PurchaseBillItem[];
  landed_cost_allocations: LandedCostAllocation[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseBillInput {
  supplier_id: number;
  bill_date: string;
  due_date: string;
  supplier_invoice_ref?: string;
  purchase_order_id?: number | null;
  freight_charges?: string | number;
  customs_duties?: string | number;
  clearing_charges?: string | number;
  other_landed_costs?: string | number;
  allocation_method?: LandedCostAllocationMethod;
  notes?: string;
  items: PurchaseBillItemInput[];
}

export interface LandedCostPreviewInput {
  allocation_method?: LandedCostAllocationMethod;
  freight_charges?: string | number;
  customs_duties?: string | number;
  clearing_charges?: string | number;
  other_landed_costs?: string | number;
}

