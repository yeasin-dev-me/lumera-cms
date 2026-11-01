/**
 * Authoritative TypeScript interfaces for Treasury, Cash, Bank, MFS & Settlement domain.
 * Step 06 of Penguin Mart BMS/ERP.
 */

export type FinancialAccountType = "cash" | "bank" | "mfs" | "clearing";
export type TransactionDirection = "inflow" | "outflow";
export type TransactionStatus = "finalized" | "pending" | "cancelled" | "reversed";

export interface FinancialAccount {
  id: number;
  public_id: string;
  code: string;
  name: string;
  account_type: FinancialAccountType;
  currency: string;
  provider: string;
  bank_name: string;
  masked_account_number: string;
  account_number?: string;
  branch_name: string;
  account_holder_name: string;
  routing_number: string;
  is_active: boolean;
  opening_balance: string;
  current_balance: string;
  notes: string;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialAccountTransaction {
  id: number;
  public_id: string;
  transaction_number: string;
  account: number;
  account_code: string;
  account_name: string;
  direction: TransactionDirection;
  amount: string;
  currency: string;
  effective_at: string;
  transaction_date: string;
  source_type: string;
  source_id: string;
  source_reference: string;
  external_reference: string;
  description: string;
  status: TransactionStatus;
  reversal_of: number | null;
  reversal_of_number?: string;
  created_by_username?: string;
  created_at: string;
}

export interface FundTransfer {
  id: number;
  public_id: string;
  transfer_number: string;
  from_account: number;
  from_account_code: string;
  from_account_name: string;
  to_account: number;
  to_account_code: string;
  to_account_name: string;
  amount: string;
  currency: string;
  transfer_date: string;
  reference: string;
  external_reference: string;
  status: "draft" | "pending_approval" | "approved" | "completed" | "rejected" | "cancelled" | "reversed";
  initiated_by_username: string;
  approved_by_username?: string;
  approved_at?: string;
  completed_by_username?: string;
  completed_at?: string;
  outflow_transaction_number?: string;
  inflow_transaction_number?: string;
  reversal_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerReceipt {
  id: number;
  public_id: string;
  receipt_number: string;
  customer: number;
  customer_code: string;
  customer_name: string;
  financial_account: number;
  account_code: string;
  account_name: string;
  amount: string;
  currency: string;
  receipt_date: string;
  payment_method: string;
  external_reference: string;
  status: "draft" | "verified" | "cancelled" | "reversed";
  notes: string;
  supporting_document?: string;
  treasury_transaction_number?: string;
  customer_ledger_entry_number?: string;
  received_by_username: string;
  verified_by_username?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierDisbursementAllocation {
  id: number;
  public_id: string;
  purchase_bill: number;
  bill_number: string;
  supplier_invoice_ref: string;
  total_bill_amount: string;
  allocated_amount: string;
  allocation_date: string;
  notes: string;
  created_at: string;
}

export interface SupplierDisbursement {
  id: number;
  public_id: string;
  disbursement_number: string;
  supplier: number;
  supplier_code: string;
  supplier_name: string;
  financial_account: number;
  account_code: string;
  account_name: string;
  amount: string;
  currency: string;
  disbursement_date: string;
  payment_method: string;
  external_reference: string;
  status: "draft" | "pending_approval" | "approved" | "completed" | "rejected" | "cancelled" | "reversed";
  notes: string;
  supporting_document?: string;
  treasury_transaction_number?: string;
  allocations: SupplierDisbursementAllocation[];
  initiated_by_username: string;
  approved_by_username?: string;
  approved_at?: string;
  completed_by_username?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GatewaySettlementLine {
  id: number;
  public_id: string;
  external_tran_id: string;
  bank_tran_id: string;
  transaction_date: string | null;
  gross_amount: string;
  fee_amount: string;
  net_amount: string;
  matched_payment: number | null;
  matched_payment_public_id?: string;
  match_status: "matched" | "unmatched" | "short_paid" | "overpaid" | "disputed" | "duplicate" | "manually_matched";
  discrepancy_reason: string;
}

export interface GatewaySettlementBatch {
  id: number;
  public_id: string;
  batch_number: string;
  gateway: string;
  clearing_account: number;
  clearing_account_code: string;
  destination_bank_account: number;
  destination_bank_code: string;
  external_batch_ref: string;
  settlement_date: string;
  gross_amount: string;
  fee_amount: string;
  net_payout: string;
  status: "draft" | "confirmed" | "cancelled" | "reversed";
  uploaded_file?: string;
  file_hash: string;
  reconciliation_summary: Record<string, any>;
  lines_count: number;
  imported_by_username: string;
  confirmed_by_username?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CourierRemittanceLine {
  id: number;
  public_id: string;
  tracking_id: string;
  order_reference: string;
  matched_order: number | null;
  matched_order_number?: string;
  expected_cod: string;
  collected_cod: string;
  courier_fee: string;
  other_deduction: string;
  net_amount: string;
  match_status: "matched" | "unmatched" | "short_paid" | "overpaid" | "disputed" | "duplicate" | "manually_matched";
  discrepancy_reason: string;
}

export interface CourierRemittanceSheet {
  id: number;
  public_id: string;
  remittance_number: string;
  courier: string;
  clearing_account: number;
  clearing_account_code: string;
  destination_bank_account: number;
  destination_bank_code: string;
  statement_reference: string;
  remittance_date: string;
  total_collected_cod: string;
  total_courier_charges: string;
  other_deductions: string;
  net_remitted_amount: string;
  status: "draft" | "confirmed" | "cancelled" | "reversed";
  uploaded_file?: string;
  file_hash: string;
  reconciliation_summary: Record<string, any>;
  lines_count: number;
  imported_by_username: string;
  confirmed_by_username?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BankStatementLine {
  id: number;
  public_id: string;
  line_number: number;
  transaction_date: string;
  value_date?: string;
  description: string;
  reference: string;
  debit_amount: string;
  credit_amount: string;
  running_balance?: string;
  match_status: "matched" | "unmatched" | "short_paid" | "overpaid" | "disputed" | "duplicate" | "manually_matched";
  matched_transaction: number | null;
  matched_transaction_number?: string;
  discrepancy_reason: string;
}

export interface BankReconciliation {
  id: number;
  public_id: string;
  reconciliation_number: string;
  bank_account: number;
  bank_account_code: string;
  bank_account_name: string;
  statement_start_date: string;
  statement_end_date: string;
  opening_balance: string;
  closing_balance: string;
  status: "draft" | "in_progress" | "finalized" | "cancelled";
  uploaded_file?: string;
  file_hash: string;
  reconciliation_summary: Record<string, any>;
  lines_count: number;
  imported_by_username: string;
  finalized_by_username?: string;
  finalized_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CashCountReconciliation {
  id: number;
  public_id: string;
  reconciliation_number: string;
  cash_account: number;
  cash_account_code: string;
  cash_account_name: string;
  pos_session: number | null;
  pos_session_number?: string;
  count_date: string;
  expected_amount: string;
  counted_amount: string;
  difference: string;
  status: "submitted" | "approved" | "rejected";
  counted_by_username: string;
  reviewed_by_username?: string;
  reviewed_at?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TreasuryDashboardSummary {
  currency: string;
  total_liquid_funds: string;
  breakdown: {
    cash: string;
    bank: string;
    mfs: string;
    clearing: string;
  };
  pending_approvals: {
    transfers: number;
    disbursements: number;
    cash_counts: number;
    total: number;
  };
  settlements_summary: {
    draft_gateway_batches: number;
    draft_courier_sheets: number;
    unmatched_gateway_lines: number;
    unmatched_courier_lines: number;
  };
  accounts: Array<{
    id: number;
    code: string;
    name: string;
    type: FinancialAccountType;
    masked_number: string;
    balance: string;
    is_active: boolean;
  }>;
}

export interface AccountCashbookResponse {
  account_id: number;
  account_code: string;
  account_name: string;
  currency: string;
  current_balance: string;
  transactions: FinancialAccountTransaction[];
}

