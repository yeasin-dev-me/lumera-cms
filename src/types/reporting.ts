export type StatementType = "profit_and_loss" | "balance_sheet" | "cash_flow";
export type ReportCompletenessStatus = "complete" | "provisional" | "incomplete" | "blocked";
export type MappingStatus = "draft" | "submitted" | "approved" | "active" | "retired";
export type CashFlowActivity = "operating" | "investing" | "financing" | "internal_transfer" | "unclassified";

export interface ContributingAccount {
  account_id: number;
  code: string;
  name: string;
  amount: string;
}

export interface StatementLineItem {
  id?: number;
  line_id: number;
  section_code: string;
  section_name: string;
  code: string;
  name: string;
  sort_order: number;
  display_format: string;
  calculation_method: string;
  amount: string;
  statement_type?: string;
  contributing_accounts?: ContributingAccount[];
  notes?: string;
}

export interface ValidationIssue {
  code: string;
  category: string;
  severity: "blocking" | "high" | "medium" | "low";
  message: string;
  details?: string[] | any;
  action_required?: string;
  unclassified_amount?: string;
  variance?: string;
}

export interface ProfitLossSummary {
  gross_revenue: string;
  sales_returns: string;
  net_revenue: string;
  cost_of_goods_sold: string;
  gross_profit: string;
  gross_margin_pct: string | null;
  operating_expenses: string;
  operating_profit: string;
  operating_margin_pct: string | null;
  finance_costs: string;
  other_net: string;
  net_profit_before_tax: string;
  tax_provision: string;
  net_profit_after_tax: string;
  net_margin_pct: string | null;
}

export interface ProfitLossResponse {
  statement_type: "profit_and_loss";
  title: string;
  currency: string;
  status: ReportCompletenessStatus;
  fiscal_year_id: number | null;
  fiscal_year_name: string | null;
  period_id: number | null;
  period_name: string | null;
  start_date: string | null;
  end_date: string | null;
  as_of_date: string | null;
  summary: ProfitLossSummary;
  lines: StatementLineItem[];
  unmapped_accounts: any[];
  warnings: ValidationIssue[];
}

export interface BalanceSheetSummary {
  total_current_assets: string;
  total_non_current_assets: string;
  total_assets: string;
  total_current_liabilities: string;
  total_non_current_liabilities: string;
  total_liabilities: string;
  total_equity: string;
  current_period_result: string;
  total_liabilities_and_equity: string;
  difference: string;
  is_balanced: boolean;
}

export interface BalanceSheetResponse {
  statement_type: "balance_sheet";
  title: string;
  currency: string;
  status: ReportCompletenessStatus;
  as_of_date: string;
  fiscal_year_id: number | null;
  fiscal_year_name: string | null;
  period_id: number | null;
  period_name: string | null;
  summary: BalanceSheetSummary;
  subledger_reconciliation: {
    ar: any;
    ap: any;
    treasury: any;
    inventory: any;
  };
  lines: StatementLineItem[];
  unmapped_accounts: any[];
  warnings: ValidationIssue[];
}

export interface CashFlowSummary {
  operating_net: string;
  investing_net: string;
  financing_net: string;
  internal_transfers_eliminated: string;
  unclassified_amount: string;
  calculated_net_change: string;
  opening_cash: string;
  closing_cash_reconciled: string;
  closing_cash_actual_gl: string;
  variance: string;
  is_reconciled: boolean;
}

export interface CashFlowResponse {
  statement_type: "cash_flow";
  title: string;
  currency: string;
  status: ReportCompletenessStatus;
  method: string;
  fiscal_year_id: number | null;
  fiscal_year_name: string | null;
  period_id: number | null;
  period_name: string | null;
  start_date: string | null;
  end_date: string | null;
  summary: CashFlowSummary;
  lines: StatementLineItem[];
  warnings: ValidationIssue[];
}

export interface ComparativeLineItem {
  line_id: number;
  section_code: string;
  section_name: string;
  code: string;
  name: string;
  current_amount: string;
  prior_amount: string;
  absolute_variance: string;
  percentage_variance: string;
  pct_numeric: number | null;
}

export interface ComparativeResponse {
  statement_type: StatementType;
  comparison_type: string;
  currency: string;
  title?: string;
  current_label?: string;
  comparison_label?: string;
  current_period: {
    title: string;
    start_date: string | null;
    end_date: string | null;
    status: ReportCompletenessStatus;
  };
  prior_period: {
    title: string;
    start_date: string | null;
    end_date: string | null;
    status: ReportCompletenessStatus;
  } | null;
  lines: ComparativeLineItem[];
  warnings: ValidationIssue[];
}

export interface ReportingValidationResponse {
  overall_status: ReportCompletenessStatus;
  is_ready_for_reporting: boolean;
  currency: {
    code: string;
    is_approved: boolean;
  };
  trial_balance_balanced: boolean;
  issues_count: number;
  issues: ValidationIssue[];
  subledger_summary: {
    ar_reconciled: boolean;
    ap_reconciled: boolean;
    treasury_reconciled: boolean;
    inventory_reconciled: boolean;
  };
}

export interface StatementLineDrillDownResponse {
  statement_line: {
    id: number;
    code: string;
    name: string;
    section_name: string;
    statement_type: string;
  };
  filters: {
    start_date: string | null;
    end_date: string | null;
    as_of_date: string | null;
  };
  totals: {
    total_debit: string;
    total_credit: string;
    net_total: string;
  };
  accounts: {
    account_id: number;
    code: string;
    name: string;
    account_type: string;
    normal_balance: string;
    total_debit: string;
    total_credit: string;
    net_balance: string;
  }[];
  journal_entries: {
    journal_id: number;
    journal_number: string;
    journal_date: string;
    journal_type: string;
    account_code: string;
    account_name: string;
    description: string;
    reference: string;
    debit: string;
    credit: string;
    source_module: string;
    source_type: string;
    source_id: string;
    source_reference: string;
    is_reversed: boolean;
  }[];
  entries_count: number;
}

export interface AccountStatementMappingItem {
  id: number;
  public_id: string;
  account: number;
  account_code: string;
  account_name: string;
  account_type: string;
  statement_line: number;
  statement_line_code: string;
  statement_line_name: string;
  statement_type: string;
  version_number: number;
  version?: number;
  status: MappingStatus;
  effective_from: string | null;
  effective_to: string | null;
  notes: string;
  is_active: boolean;
  created_by_username: string;
  created_by_email?: string;
  submitted_by?: number | null;
  submitted_at?: string | null;
  approved_by_username?: string | null;
  approved_by_email?: string;
  approved_at?: string | null;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CashFlowAccountMappingItem {
  id: number;
  public_id: string;
  account: number;
  account_id?: number;
  account_code: string;
  account_name: string;
  account_type: string;
  is_cash_equivalent: boolean;
  default_activity: CashFlowActivity;
  notes: string;
  is_active: boolean;
  created_by_username: string;
  approved_by_username?: string | null;
  approved_at?: string | null;
  created_at: string;
}

export interface ReportSnapshotItem {
  id: number;
  public_id: string;
  report_type: string;
  statement_type?: string;
  snapshot_number?: string;
  title?: string;
  name: string;
  notes?: string;
  fiscal_year: number | null;
  accounting_period: number | null;
  period_name?: string;
  start_date: string | null;
  end_date: string | null;
  as_of_date: string | null;
  currency: string;
  status: ReportCompletenessStatus;
  is_finalized: boolean;
  finalized_by_username?: string | null;
  finalized_at?: string | null;
  validation_warnings: ValidationIssue[];
  calculated_data: any;
  summary_metrics?: any;
  statement_payload?: any;
  mapping_version_snapshot: Record<string, number>;
  created_by_username?: string | null;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportingDashboardData {
  overall_status: ReportCompletenessStatus;
  status?: ReportCompletenessStatus;
  is_ready_for_reporting: boolean;
  currency: {
    code: string;
    is_approved: boolean;
  };
  trial_balance_balanced: boolean;
  issues_count: number;
  validation_issues: ValidationIssue[];
  subledger_summary: {
    ar_reconciled: boolean;
    ap_reconciled: boolean;
    treasury_reconciled: boolean;
    inventory_reconciled: boolean;
  };
  profit_loss_summary: ProfitLossSummary;
  profit_loss?: ProfitLossSummary;
  balance_sheet_summary: BalanceSheetSummary;
  balance_sheet?: BalanceSheetSummary;
  cash_flow_summary: CashFlowSummary;
  cash_flow?: CashFlowSummary;
  recent_snapshots: ReportSnapshotItem[];
}

export type FinancialReportingDashboardData = ReportingDashboardData;
export type ComparativeStatementResponse = ComparativeResponse;
export type FinancialValidationResponse = ReportingValidationResponse;
export type ReportSnapshotDetail = ReportSnapshotItem;

