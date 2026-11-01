/**
 * TypeScript domain types for Business Foundation & Settings (apps.business).
 */

export interface CurrencyConfig {
  id: number;
  public_id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base: boolean;
  is_active: boolean;
  is_approved: boolean;
  display_format: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: number;
  public_id: string;
  company_name: string;
  legal_name: string;
  tax_id: string;
  vat_bin: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  timezone: string;
  currency_code: string;
  currency_symbol: string;
  is_base_currency_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfileUpdatePayload {
  company_name?: string;
  legal_name?: string;
  tax_id?: string;
  vat_bin?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
}

export interface FiscalYear {
  id: number;
  public_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  periods_count: number;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface FiscalYearCreatePayload {
  name: string;
  start_date: string;
  end_date: string;
  auto_generate_periods?: boolean;
}

export interface AccountingPeriod {
  id: number;
  public_id: string;
  fiscal_year: number;
  fiscal_year_name: string;
  period_number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by?: number;
  created_at: string;
  updated_at: string;
}

export type NumberingDocType =
  | "sales_invoice"
  | "purchase_order"
  | "purchase_bill"
  | "customer_receipt"
  | "supplier_payment"
  | "expense_voucher"
  | "journal_voucher";

export type NumberingResetPolicy = "never" | "monthly" | "annual";

export interface NumberingSequence {
  id: number;
  public_id: string;
  doc_type: NumberingDocType;
  name: string;
  prefix: string;
  padding_length: number;
  current_number: number;
  reset_policy: NumberingResetPolicy;
  current_period_key: string;
  is_active: boolean;
  next_preview_number: string;
  created_at: string;
  updated_at: string;
}

export interface NumberingSequenceUpdatePayload {
  name?: string;
  prefix?: string;
  padding_length?: number;
  reset_policy?: NumberingResetPolicy;
  is_active?: boolean;
}

