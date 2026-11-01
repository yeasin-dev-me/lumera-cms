/**
 * TypeScript types for Double-Entry Accounting & General Ledger domain (apps.accounting).
 * Step 08 of Penguin Mart BMS/ERP.
 */

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";

export type JournalType = "general" | "adjustment" | "opening_balance" | "closing" | "reversal";
export type JournalStatus = "draft" | "pending_approval" | "approved" | "posted" | "rejected" | "cancelled";

export interface Account {
  id: number;
  public_id: string;
  code: string;
  name: string;
  description: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent: number | null;
  parent_code?: string | null;
  parent_name?: string | null;
  is_group: boolean;
  allow_posting: boolean;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Account[];
}

export interface AccountTreeNode {
  id: number;
  public_id: string;
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  is_group: boolean;
  allow_posting: boolean;
  is_active: boolean;
  is_system: boolean;
  parent_id: number | null;
  parent_code?: string | null;
  children: AccountTreeNode[];
}

export interface AccountCreatePayload {
  code: string;
  name: string;
  description?: string;
  account_type: AccountType;
  normal_balance?: NormalBalance;
  parent?: number | null;
  is_group?: boolean;
  allow_posting?: boolean;
  sort_order?: number;
}

export interface AccountUpdatePayload {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  parent?: number | null;
}

export interface JournalLine {
  id: number;
  line_number: number;
  account: number;
  account_code: string;
  account_name: string;
  description: string;
  debit: string;
  credit: string;
  currency: string;
  created_at: string;
}

export interface JournalLineInput {
  account_id?: number;
  account_code?: string;
  description?: string;
  debit: string | number;
  credit: string | number;
}

export interface JournalEntry {
  id: number;
  public_id: string;
  journal_number: string;
  journal_type: JournalType;
  journal_date: string;
  accounting_period: number;
  accounting_period_name?: string;
  fiscal_year: number;
  fiscal_year_name?: string;
  description: string;
  reference: string;
  status: JournalStatus;
  total_debit: string;
  total_credit: string;
  currency: string;
  source_module?: string;
  source_type?: string;
  source_id?: string;
  source_reference?: string;
  idempotency_key?: string;
  lines?: JournalLine[];
  created_by?: number;
  created_by_name?: string;
  submitted_by?: number | null;
  submitted_by_name?: string | null;
  submitted_at?: string | null;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  posted_by?: number | null;
  posted_by_name?: string | null;
  posted_at?: string | null;
  rejected_by?: number | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string;
  cancelled_by?: number | null;
  cancelled_by_name?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string;
  reversal_of?: number | null;
  reversal_of_number?: string | null;
  is_reversed: boolean;
  reversed_by?: number | null;
  reversed_by_name?: string | null;
  reversed_at?: string | null;
  reversal_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreatePayload {
  journal_date: string;
  journal_type?: JournalType;
  description: string;
  reference?: string;
  currency?: string;
  idempotency_key?: string;
  lines: JournalLineInput[];
}

export interface JournalEntryUpdatePayload {
  journal_date?: string;
  description?: string;
  reference?: string;
  lines?: JournalLineInput[];
}

export interface AccountingPeriodInfo {
  id: number;
  public_id: string;
  fiscal_year_id: number;
  fiscal_year_name: string;
  period_number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string | null;
  closed_by_name?: string | null;
  lock_reason?: string;
  reopened_at?: string | null;
  reopened_by_name?: string | null;
  reopen_reason?: string;
}

export interface PeriodReadinessReport {
  period_id: number;
  period_name: string;
  is_closed: boolean;
  start_date: string;
  end_date: string;
  draft_journals_count: number;
  pending_approval_count: number;
  approved_unposted_count: number;
  posted_journals_count: number;
  is_ready_to_close: boolean;
  warnings: string[];
}

export interface TrialBalanceLine {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  total_debit: string;
  total_credit: string;
  closing_debit: string;
  closing_credit: string;
}

export interface TrialBalanceReport {
  is_balanced: boolean;
  total_debit: string;
  total_credit: string;
  closing_debit_total: string;
  closing_credit_total: string;
  difference: string;
  period_id: number | null;
  fiscal_year_id: number | null;
  start_date: string | null;
  end_date: string | null;
  as_of_date: string | null;
  accounts_count: number;
  lines: TrialBalanceLine[];
}

export interface GeneralLedgerEntry {
  line_id: number;
  journal_id: number;
  journal_number: string;
  journal_type: JournalType;
  journal_date: string;
  account_id: number;
  account_code: string;
  account_name: string;
  description: string;
  reference: string;
  debit: string;
  credit: string;
  running_balance: string;
  is_reversed: boolean;
  reversal_of?: string | null;
}

export interface GeneralLedgerReport {
  account: {
    id: number;
    code: string;
    name: string;
    account_type: AccountType;
    normal_balance: NormalBalance;
  } | null;
  total_debit: string;
  total_credit: string;
  closing_balance: string;
  entries_count: number;
  entries: GeneralLedgerEntry[];
}

export interface AccountingDashboardMetrics {
  accounts: {
    total_active: number;
    group_accounts: number;
    posting_accounts: number;
  };
  journals: {
    draft_count: number;
    pending_approval_count: number;
    approved_unposted_count: number;
    posted_count: number;
    reversed_count: number;
  };
  current_open_period: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  } | null;
  trial_balance: {
    is_balanced: boolean;
    total_debit: string;
    total_credit: string;
    difference: string;
  };
  recent_journals: Array<{
    id: number;
    journal_number: string;
    journal_date: string;
    journal_type: JournalType;
    status: JournalStatus;
    total_debit: string;
    total_credit: string;
    description: string;
  }>;
}

