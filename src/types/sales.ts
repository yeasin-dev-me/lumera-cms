/**
 * TypeScript interfaces for Sales & Invoice Management (apps.sales - Step 04)
 */

export type SalesChannel = "online" | "pos" | "wholesale";

export type SalesInvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled"
  | "void";

export type CostingStatus = "uncosted" | "partially_costed" | "fully_costed";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export type CreditApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

export type TenderMethod =
  | "cash"
  | "pos_card"
  | "bkash"
  | "nagad"
  | "bank_transfer"
  | "credit_terms";

export type PaymentTerms = "immediate" | "net_15" | "net_30" | "net_60";

export type POSSessionStatus = "open" | "closed";

export type SalesReturnStatus =
  | "draft"
  | "received"
  | "inspected"
  | "completed"
  | "cancelled";

export type ReturnCondition = "resellable" | "damaged" | "expired" | "uninspected";

export type CreditNoteStatus = "draft" | "issued" | "void";

export interface SalesInvoiceItem {
  id: number;
  public_id: string;
  invoice?: number;
  product?: number | null;
  product_name: string;
  product_sku: string;
  product_name_snapshot: string;
  product_sku_snapshot: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  subtotal: string;
  total: string;
  unit_cost: string;
  total_cogs: string;
  costing_status: CostingStatus;
  notes: string;
  created_at: string;
}

export interface SalesInvoice {
  id: number;
  public_id: string;
  invoice_number: string;
  channel: SalesChannel;
  status: SalesInvoiceStatus;
  payment_status: PaymentStatus;
  costing_status: CostingStatus;
  customer?: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order?: number | null;
  order_number?: string | null;
  pos_session?: number | null;
  pos_session_number?: string | null;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;
  payment_terms: PaymentTerms;
  due_date?: string | null;
  credit_approved: boolean;
  credit_approved_by?: number | null;
  credit_approved_by_email?: string | null;
  credit_approved_at?: string | null;
  tender_method: TenderMethod;
  payment_reference: string;
  notes: string;
  terms_and_conditions: string;
  issued_by?: number | null;
  issued_by_email?: string | null;
  issued_at?: string | null;
  voided_by?: number | null;
  voided_by_email?: string | null;
  voided_at?: string | null;
  void_reason: string;
  is_voidable: boolean;
  is_editable: boolean;
  remaining_creditable_amount?: string;
  items: SalesInvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface POSSession {
  id: number;
  public_id: string;
  session_number: string;
  cashier: number;
  cashier_name: string;
  cashier_email: string;
  register_name: string;
  status: POSSessionStatus;
  opening_cash: string;
  closing_cash_counted: string;
  expected_cash: string;
  cash_discrepancy: string;
  total_sales_amount: string;
  total_cash_sales: string;
  total_card_sales: string;
  total_bkash_sales: string;
  total_other_sales: string;
  total_invoices_count: number;
  opened_at: string;
  closed_at?: string | null;
  closing_notes: string;
  created_at: string;
  updated_at: string;
}

export interface SalesReturnItem {
  id: number;
  public_id: string;
  sales_return?: number;
  invoice_item: number;
  product?: number | null;
  product_name: string;
  product_sku: string;
  return_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  condition: ReturnCondition;
  unit_cost: string;
  notes: string;
  created_at: string;
}

export interface SalesReturn {
  id: number;
  public_id: string;
  return_number: string;
  invoice: number;
  invoice_number: string;
  status: SalesReturnStatus;
  total_return_amount: string;
  reason: string;
  inspected_by?: number | null;
  inspected_by_email?: string | null;
  inspected_at?: string | null;
  completed_by?: number | null;
  completed_by_email?: string | null;
  completed_at?: string | null;
  items: SalesReturnItem[];
  created_at: string;
  updated_at: string;
}

export interface CreditNoteItem {
  id: number;
  public_id: string;
  credit_note?: number;
  invoice_item?: number | null;
  product?: number | null;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  tax_amount: string;
  total_amount: string;
  notes: string;
  created_at: string;
}

export interface CreditNote {
  id: number;
  public_id: string;
  credit_note_number: string;
  invoice: number;
  invoice_number: string;
  sales_return?: number | null;
  sales_return_number?: string | null;
  status: CreditNoteStatus;
  subtotal_amount: string;
  tax_amount: string;
  grand_total: string;
  reason: string;
  issued_by?: number | null;
  issued_by_email?: string | null;
  issued_at?: string | null;
  voided_by?: number | null;
  voided_by_email?: string | null;
  voided_at?: string | null;
  void_reason: string;
  items: CreditNoteItem[];
  created_at: string;
  updated_at: string;
}

// Input Types

export interface OpenPOSSessionInput {
  register_name?: string;
  opening_cash?: string | number;
}

export interface ClosePOSSessionInput {
  closing_cash_counted: string | number;
  closing_notes?: string;
}

export interface POSCartItem {
  product_id: number;
  quantity: number;
  unit_price?: string | number;
  discount_amount?: string | number;
  tax_rate?: string | number;
}

export interface POSCheckoutInput {
  session_id: number;
  items: POSCartItem[];
  tender_method: TenderMethod;
  amount_tendered: string | number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  payment_reference?: string;
  discount_amount?: string | number;
  notes?: string;
}

export interface WholesaleItemInput {
  product_id: number;
  quantity: number;
  unit_price: string | number;
  tax_rate?: string | number;
  discount_amount?: string | number;
}

export interface CreateWholesaleInvoiceInput {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  payment_terms?: PaymentTerms;
  items: WholesaleItemInput[];
  notes?: string;
  terms_and_conditions?: string;
}

export interface CreateSalesReturnInput {
  invoice_id: number;
  reason?: string;
  items: {
    invoice_item_id: number;
    return_quantity: number;
    notes?: string;
  }[];
}

export interface InspectReturnInput {
  inspections: {
    item_id: number;
    accepted_quantity: number;
    rejected_quantity?: number;
    condition: ReturnCondition;
    notes?: string;
  }[];
}

export interface CreateCreditNoteInput {
  invoice_id: number;
  sales_return_id?: number | null;
  reason?: string;
  items?: {
    invoice_item_id?: number | null;
    quantity: number;
    unit_price: string | number;
    notes?: string;
  }[];
}

