/**
 * TypeScript interfaces for Step 07: Expense Management, Owner Equity & Loan Management.
 */

export interface ExpenseCategory {
  id: number;
  public_id: string;
  name: string;
  code: string;
  description: string;
  parent: number | null;
  parent_name: string | null;
  is_active: boolean;
  sort_order: number;
  voucher_count?: number;
  created_at: string;
  updated_at: string;
}

export type ExpenseVoucherStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "partially_paid"
  | "paid"
  | "rejected"
  | "cancelled";

export interface ExpenseVoucherAttachment {
  id: number;
  public_id: string;
  voucher: number;
  file: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  document_type: string;
  document_type_display: string;
  description: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface ExpenseDisbursement {
  id: number;
  public_id: string;
  disbursement_number: string;
  voucher: number;
  financial_account: number;
  financial_account_name: string;
  financial_account_code: string;
  amount: string;
  currency: string;
  disbursement_date: string;
  payment_method: string;
  payment_method_display: string;
  reference_number: string;
  notes: string;
  treasury_transaction: number | null;
  treasury_transaction_number: string | null;
  disbursed_by: number;
  disbursed_by_name: string;
  status: "completed" | "reversed";
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseVoucher {
  id: number;
  public_id: string;
  voucher_number: string;
  category: number | ExpenseCategory;
  category_name?: string;
  category_code?: string;
  expense_date: string;
  payee_name: string;
  amount: string;
  currency: string;
  description: string;
  reference_number: string;
  notes?: string;
  status: ExpenseVoucherStatus;
  status_display: string;
  paid_amount: string;
  remaining_amount: string;
  attachment_count?: number;
  requested_by: number;
  requested_by_name: string;
  submitted_at: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_by: number | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
  rejection_reason?: string;
  cancelled_by: number | null;
  cancelled_by_name: string | null;
  cancelled_at: string | null;
  cancellation_reason?: string;
  attachments?: ExpenseVoucherAttachment[];
  disbursements?: ExpenseDisbursement[];
  created_at: string;
  updated_at?: string;
}

export type ContributorType = "owner" | "partner" | "investor" | "other";
export type CapitalStatus = "pending" | "verified" | "cancelled" | "reversed";

export interface CapitalContribution {
  id: number;
  public_id: string;
  contribution_number: string;
  contributor_type: ContributorType;
  contributor_type_display: string;
  contributor_name: string;
  contributor_contact: string;
  amount: string;
  currency: string;
  contribution_date: string;
  payment_method: string;
  financial_account: number;
  financial_account_name: string;
  financial_account_code: string;
  treasury_transaction: number | null;
  treasury_transaction_number: string | null;
  status: CapitalStatus;
  status_display: string;
  reference_note: string;
  supporting_document: string | null;
  recorded_by: number;
  recorded_by_name: string;
  verified_by: number | null;
  verified_by_name: string | null;
  verified_at: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

export type LoanStatus = "draft" | "pending_verification" | "active" | "settled" | "cancelled" | "disputed";

export interface LoanRepaymentSchedule {
  id: number;
  public_id: string;
  loan_contract: number;
  installment_number: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  total_due: string;
  principal_paid: string;
  interest_paid: string;
  status: "pending" | "partially_paid" | "paid" | "overdue";
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface LoanRepayment {
  id: number;
  public_id: string;
  repayment_number: string;
  loan_contract: number;
  schedule: number | null;
  financial_account: number;
  financial_account_name: string;
  financial_account_code: string;
  principal_amount: string;
  interest_amount: string;
  total_amount: string;
  currency: string;
  repayment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  treasury_transaction: number | null;
  treasury_transaction_number: string | null;
  recorded_by: number;
  recorded_by_name: string;
  status: "completed" | "reversed";
  created_at: string;
}

export interface LoanContract {
  id: number;
  public_id: string;
  contract_number: string;
  lender_name: string;
  lender_type: string;
  lender_type_display?: string;
  lender_contact: string;
  principal_amount: string;
  currency: string;
  agreement_date: string;
  disbursement_date: string | null;
  maturity_date: string | null;
  loan_classification: string;
  loan_classification_display: string;
  interest_type: string;
  interest_type_display: string;
  interest_rate: string | null;
  repayment_frequency: string;
  repayment_frequency_display?: string;
  contractual_terms: string;
  supporting_document: string | null;
  status: LoanStatus;
  status_display: string;
  disbursement_account?: number | null;
  disbursement_account_name?: string | null;
  treasury_transaction?: number | null;
  treasury_transaction_number?: string | null;
  total_principal_repaid: string;
  outstanding_principal: string;
  total_interest_paid: string;
  recorded_by: number;
  recorded_by_name?: string;
  verified_by?: number | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  schedules?: LoanRepaymentSchedule[];
  repayments?: LoanRepayment[];
  created_at: string;
  updated_at?: string;
}

export type DrawingStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "disbursed"
  | "rejected"
  | "cancelled"
  | "reversed";

export interface OwnerDrawing {
  id: number;
  public_id: string;
  drawing_number: string;
  recipient_name: string;
  recipient_role: string;
  amount: string;
  currency: string;
  drawing_date: string;
  reason: string;
  payment_method: string;
  financial_account: number;
  financial_account_name: string;
  financial_account_code: string;
  treasury_transaction: number | null;
  treasury_transaction_number: string | null;
  status: DrawingStatus;
  status_display: string;
  requested_by: number;
  requested_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  notes: string;
  supporting_document: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseDashboardMetrics {
  total_vouchers_count: number;
  total_voucher_amount: string;
  total_paid_amount: string;
  total_outstanding_payable: string;
  pending_approval_count: number;
  pending_approval_amount: string;
  approved_unpaid_count: number;
  approved_unpaid_amount: string;
  partially_paid_count: number;
  paid_count: number;
  rejected_count: number;
}

export interface ExpenseCategoryBreakdownItem {
  category_id: number;
  category_public_id: string;
  category_code: string;
  category_name: string;
  voucher_count: number;
  total_amount: string;
  disbursed_amount: string;
  remaining_amount: string;
}

export interface CapitalSummary {
  total_verified_capital: string;
  verified_count: number;
  total_pending_capital: string;
  pending_count: number;
}

export interface LoansSummary {
  total_loans_count: number;
  active_loans_count: number;
  settled_loans_count: number;
  total_principal_contracted: string;
  total_principal_repaid: string;
  total_interest_paid: string;
  total_outstanding_principal: string;
}

export interface DrawingsSummary {
  total_disbursed_drawings: string;
  disbursed_count: number;
  total_pending_approval: string;
  pending_count: number;
}

export interface FinanceSummary {
  capital: CapitalSummary;
  loans: LoansSummary;
  drawings: DrawingsSummary;
}

