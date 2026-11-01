/**
 * TypeScript types for Customer Management & Receivables domain (apps.customers).
 * Aligned with Step 05 of Penguin Mart BMS/ERP.
 */

export type CustomerType = "retail" | "wholesale" | "corporate";
export type CreditStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

export interface UserBasic {
  id: number;
  public_id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
}

export interface CustomerProfile {
  id: number;
  public_id: string;
  user: UserBasic;
  customer_type: CustomerType;
  business_name: string;
  business_contact_person: string;
  tax_identifier: string;
  credit_enabled: boolean;
  credit_status: CreditStatus;
  credit_limit: string;
  payment_terms_days: number;
  trade_license_document: string | null;
  credit_notes: string;
  approved_by: number | null;
  approved_by_email: string | null;
  approved_at: string | null;
  display_name: string;
  is_credit_eligible: boolean;
  total_outstanding_receivables: string;
  available_credit: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerLedgerEntry {
  id: number;
  public_id: string;
  customer: number;
  customer_display_name: string;
  entry_type: "invoice" | "payment" | "credit_note" | "opening_balance" | "adjustment" | "invoice_reversal";
  entry_number: string;
  debit_amount: string;
  credit_amount: string;
  currency: string;
  effective_date: string;
  due_date: string | null;
  source_type: string;
  source_id: string;
  source_reference: string;
  description: string;
  idempotency_key: string | null;
  created_at: string;
}

export interface CustomerPaymentAllocation {
  id: number;
  public_id: string;
  customer: number;
  customer_display_name: string;
  receipt_entry: number;
  receipt_entry_number: string;
  invoice: number;
  invoice_number: string;
  allocated_amount: string;
  allocation_date: string;
  allocation_reference: string;
  idempotency_key: string | null;
  created_at: string;
}

export interface CreditSummary {
  customer_id: number;
  customer_name: string;
  customer_type: CustomerType;
  credit_enabled: boolean;
  credit_status: CreditStatus;
  approved_credit_limit: string;
  payment_terms_days: number;
  total_outstanding_receivables: string;
  available_credit: string;
  total_unallocated_advances: string;
  total_overdue_receivables: string;
  approved_by: string | null;
  approved_at: string | null;
}

export interface ReceivablesSummary {
  total_outstanding_receivables: string;
  total_overdue_receivables: string;
  total_unallocated_advances: string;
  customers_with_balance_count: number;
  overdue_customers_count: number;
  as_of_date: string;
}

export interface AgingBucketSummary {
  current: string;
  days_1_30: string;
  days_31_60: string;
  days_61_90: string;
  days_over_90: string;
  total_outstanding: string;
}

export interface AgingCustomerRow {
  customer_id: number;
  customer_name: string;
  current: string;
  days_1_30: string;
  days_31_60: string;
  days_61_90: string;
  days_over_90: string;
  total: string;
}

export interface AgingInvoiceDetail {
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  grand_total: string;
  outstanding_balance: string;
  overdue_days: number;
  bucket: "current" | "days_1_30" | "days_31_60" | "days_61_90" | "days_over_90";
}

export interface ReceivablesAging {
  as_of_date: string;
  summary: AgingBucketSummary;
  customers: AgingCustomerRow[];
  invoices: AgingInvoiceDetail[];
}

export interface StatementEntry {
  id: number;
  entry_number: string;
  effective_date: string;
  due_date: string | null;
  entry_type: string;
  source_type: string;
  source_id: string;
  source_reference: string;
  description: string;
  debit_amount: string;
  credit_amount: string;
  running_balance: string;
}

export interface CustomerStatement {
  company_name: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  business_name: string;
  tax_identifier: string;
  customer_type: CustomerType;
  start_date: string | null;
  end_date: string | null;
  opening_balance: string;
  total_period_debits: string;
  total_period_credits: string;
  closing_balance: string;
  total_unallocated_advances: string;
  entries: StatementEntry[];
  generated_at: string;
}

export interface SupplierStatementBill {
  bill_number: string;
  supplier_invoice_ref: string;
  purchase_order_number: string | null;
  bill_date: string;
  due_date: string;
  subtotal: string;
  freight_charges: string;
  customs_duties: string;
  clearing_charges: string;
  other_landed_costs: string;
  total_landed_costs: string;
  total_amount: string;
  status: string;
  items_count: number;
}

export interface SupplierStatement {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  payment_terms_days: number;
  statement_period: {
    start_date: string | null;
    end_date: string | null;
  };
  summary: {
    total_bills_count: number;
    total_raw_subtotal: string;
    total_landed_costs: string;
    total_billed_payable: string;
    treasury_integration_note: string;
  };
  bills: SupplierStatementBill[];
  generated_at: string;
}

export interface OutstandingInvoiceSummary {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  customer_name: string;
  sales_channel: string;
  invoice_date: string;
  due_date: string;
  grand_total: string;
  outstanding_balance: string;
  overdue_days: number;
  payment_status: string;
}

