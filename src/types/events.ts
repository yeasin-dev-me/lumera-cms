/**
 * TypeScript types for Automated Commercial Event Integration & General Ledger Sync (apps.events).
 * Step 09 of Penguin Mart BMS/ERP.
 */

export type CommercialEventType =
  | "sales.invoice_posted"
  | "sales.cogs_posted"
  | "sales.credit_note_posted"
  | "procurement.purchase_bill_posted"
  | "procurement.landed_cost_posted"
  | "inventory.adjustment_posted"
  | "treasury.customer_receipt_completed"
  | "treasury.supplier_disbursement_completed"
  | "treasury.fund_transfer_completed"
  | "treasury.gateway_settlement_completed"
  | "treasury.courier_remittance_completed"
  | "treasury.cash_variance_approved"
  | "treasury.bank_variance_approved"
  | "expenses.expense_disbursement_completed"
  | "expenses.capital_contribution_received"
  | "expenses.loan_proceeds_received"
  | "expenses.loan_repayment_completed"
  | "expenses.owner_drawing_completed";

export type EventStatus =
  | "pending"
  | "mapping_required"
  | "processing"
  | "retry_scheduled"
  | "posted"
  | "failed_permanent"
  | "dead_letter"
  | "ignored"
  | "reversed";

export type MappingStatus = "draft" | "pending_approval" | "approved" | "active" | "retired";

export interface AccountingEventHistory {
  id: number;
  event_id: number;
  from_status: string;
  to_status: string;
  action: string;
  actor_id?: number | null;
  actor_email?: string | null;
  actor_type: string;
  journal_entry_id?: number | null;
  journal_number?: string | null;
  notes: string;
  created_at: string;
}

export interface AccountingEvent {
  id: number;
  public_id: string;
  event_type: CommercialEventType;
  schema_version: number;
  source_module: string;
  source_type: string;
  source_id: string;
  source_reference: string;
  source_version: number;
  event_key: string;
  occurred_at: string;
  accounting_date: string;
  currency: string;
  payload?: Record<string, any>;
  status: EventStatus;
  attempt_count: number;
  max_attempts: number;
  next_retry_at?: string | null;
  last_attempt_at?: string | null;
  processing_lease_expires_at?: string | null;
  last_error_code: string;
  last_error_message: string;
  processed_at?: string | null;
  accounting_journal_id?: number | null;
  journal_number?: string | null;
  mapping_version_id?: number | null;
  correlation_id: string;
  causation_id: string;
  reversal_of_event_id?: number | null;
  history?: AccountingEventHistory[];
  created_at: string;
  updated_at: string;
}

export interface AccountingEventMappingVersion {
  id: number;
  mapping_id: number;
  version_number: number;
  status: MappingStatus;
  debit_account_id?: number | null;
  debit_account_code?: string | null;
  debit_account_name?: string | null;
  credit_account_id?: number | null;
  credit_account_code?: string | null;
  credit_account_name?: string | null;
  additional_rules: Record<string, any>;
  effective_from?: string | null;
  effective_to?: string | null;
  created_by_id: number;
  created_by_email?: string | null;
  submitted_by_id?: number | null;
  submitted_by_email?: string | null;
  submitted_at?: string | null;
  approved_by_id?: number | null;
  approved_by_email?: string | null;
  approved_at?: string | null;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountingEventMapping {
  id: number;
  event_type: CommercialEventType;
  name: string;
  description: string;
  is_active: boolean;
  current_version_id?: number | null;
  current_version_details?: AccountingEventMappingVersion | null;
  versions_count: number;
  created_at: string;
  updated_at: string;
}

export interface TreasuryAccountMapping {
  id: number;
  financial_account_id: number;
  financial_account_code: string;
  financial_account_name: string;
  financial_account_type: string;
  accounting_account_id: number;
  accounting_account_code: string;
  accounting_account_name: string;
  is_active: boolean;
  notes: string;
  created_by_id: number;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategoryAccountMapping {
  id: number;
  expense_category_id: number;
  expense_category_code: string;
  expense_category_name: string;
  accounting_account_id: number;
  accounting_account_code: string;
  accounting_account_name: string;
  is_active: boolean;
  created_by_id: number;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventQueueStats {
  total: number;
  pending: number;
  mapping_required: number;
  processing: number;
  retry_scheduled: number;
  posted: number;
  failed_permanent: number;
  dead_letter: number;
  ignored: number;
  reversed: number;
}

export interface SubledgerReconciliationSummary {
  module: string;
  gl_account_code?: string;
  gl_account_name?: string;
  gl_balance?: string;
  subledger_balance?: string;
  total_gl_balance?: string;
  total_subledger_balance?: string;
  difference: string;
  is_reconciled: boolean;
  status: "reconciled" | "unreconciled";
  items?: Array<{
    financial_account_id: number;
    financial_account_code: string;
    financial_account_name: string;
    accounting_account_id: number;
    accounting_account_code: string;
    accounting_account_name: string;
    operational_balance: string;
    gl_balance: string;
    difference: string;
    is_reconciled: boolean;
  }>;
}

export interface ConsolidatedReconciliationReport {
  generated_at: string;
  is_fully_reconciled: boolean;
  summary: {
    ar: SubledgerReconciliationSummary;
    ap: SubledgerReconciliationSummary;
    treasury: SubledgerReconciliationSummary;
    inventory: SubledgerReconciliationSummary;
  };
}

export interface DryRunPreviewResult {
  event_type: string;
  mapping_version: number;
  description: string;
  total_debit: string;
  total_credit: string;
  difference: string;
  is_balanced: boolean;
  currency: string;
  lines: Array<{
    account_id: number;
    account_code: string;
    account_name: string;
    debit: string;
    credit: string;
    description: string;
  }>;
}

