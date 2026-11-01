"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { LoanContract } from "@/types/expenses";
import { FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  Coins,
  CheckCircle2,
  Calendar,
  CreditCard,
  RotateCcw,
  Landmark,
  X,
  PlusCircle,
  FileText,
} from "lucide-react";

export default function LoanContractDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loan, setLoan] = useState<LoanContract | null>(null);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Receive Proceeds Modal
  const [isProceedsOpen, setIsProceedsOpen] = useState<boolean>(false);
  const [proceedsAccount, setProceedsAccount] = useState<string>("");
  const [receiving, setReceiving] = useState<boolean>(false);

  // Repayment Modal
  const [isRepayOpen, setIsRepayOpen] = useState<boolean>(false);
  const [repayForm, setRepayForm] = useState({
    financial_account_id: "",
    principal_amount: "",
    interest_amount: "0.00",
    payment_method: "bank_transfer",
    reference_number: "",
    notes: "",
  });
  const [repaying, setRepaying] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [l, accs] = await Promise.all([
        adminApi.getLoanContract(id),
        adminApi.getFinancialAccounts({ is_active: true }),
      ]);
      setLoan(l);
      setFinancialAccounts(accs);
      if (accs.length > 0) {
        setProceedsAccount(String(accs[0].id));
        setRepayForm((prev) => ({
          ...prev,
          financial_account_id: String(accs[0].id),
          principal_amount: l.outstanding_principal,
        }));
      }
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to load loan details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleReceiveProceeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    try {
      setReceiving(true);
      setError(null);
      await adminApi.receiveLoanProceeds(loan.id, {
        financial_account_id: Number(proceedsAccount),
      });
      setIsProceedsOpen(false);
      setSuccessMsg("Loan principal proceeds received into Treasury account. Loan is now ACTIVE.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to receive loan proceeds.");
    } finally {
      setReceiving(false);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    try {
      setRepaying(true);
      setError(null);
      await adminApi.repayLoan(loan.id, {
        financial_account_id: Number(repayForm.financial_account_id),
        principal_amount: repayForm.principal_amount,
        interest_amount: repayForm.interest_amount,
        payment_method: repayForm.payment_method,
        reference_number: repayForm.reference_number,
        notes: repayForm.notes,
      });
      setIsRepayOpen(false);
      setSuccessMsg("Loan repayment recorded. Funds deducted from Treasury account.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Repayment failed.");
    } finally {
      setRepaying(false);
    }
  };

  const handleReverseRepayment = async (repayId: number) => {
    const reason = prompt("Enter reason for reversing this loan repayment:");
    if (reason === null) return;
    try {
      setError(null);
      await adminApi.reverseLoanRepayment(repayId, reason);
      setSuccessMsg("Loan repayment reversed. Funds restored to Treasury.");
      await loadData();
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Reversal failed.");
    }
  };

  if (loading && !loan) {
    return <div className="p-8 text-center text-gray-500">Loading loan details...</div>;
  }

  if (!loan) {
    return (
      <div className="p-8 text-center text-red-500">
        Loan contract not found. <Link href="/finance/loans" className="underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/finance/loans" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> All Loans
            </Link>
            <span>/</span>
            <span className="font-mono">{loan.contract_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{loan.contract_number}</h1>
            <Badge
              variant={
                loan.status === "active"
                  ? "primary"
                  : loan.status === "settled"
                  ? "success"
                  : loan.status === "draft"
                  ? "muted"
                  : "warning"
              }
            >
              {loan.status_display}
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {(loan.status === "draft" || loan.status === "pending_verification") && (
            <Button variant="primary" onClick={() => setIsProceedsOpen(true)} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Receive Principal Proceeds
            </Button>
          )}

          {loan.status === "active" && (
            <>
              <Link href={`/finance/loans/${loan.id}/schedule`}>
                <Button variant="secondary" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Repayment Schedule
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setIsRepayOpen(true)} className="gap-2">
                <CreditCard className="h-4 w-4" />
                Record Repayment
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Grid: Loan Specs & Debt Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-base border-b pb-3">Contract Terms & Creditor Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Lender / Creditor</p>
                <p className="font-semibold text-gray-900 mt-0.5">{loan.lender_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{loan.lender_type_display}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Loan Classification</p>
                <p className="font-semibold text-gray-900 mt-0.5">{loan.loan_classification_display}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Agreement Date</p>
                <p className="text-gray-900 mt-0.5">{loan.agreement_date}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Maturity Date</p>
                <p className="text-gray-900 mt-0.5">{loan.maturity_date || "—"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Interest Terms</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {loan.interest_type_display}
                  {loan.interest_rate ? ` (${loan.interest_rate}%)` : ""}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Repayment Frequency</p>
                <p className="text-gray-900 mt-0.5">{loan.repayment_frequency_display}</p>
              </div>

              {loan.disbursement_account_name && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Proceeds Deposited In</p>
                  <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-blue-600" />
                    {loan.disbursement_account_name} &bull; TX #{loan.treasury_transaction_number}
                  </p>
                </div>
              )}

              {loan.contractual_terms && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Contractual Stipulations</p>
                  <p className="text-gray-800 mt-0.5 bg-gray-50 p-3 rounded-lg border">{loan.contractual_terms}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Repayments History */}
          <Card className="p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-base mb-4 flex items-center justify-between">
              <span>Repayment History</span>
              <span className="text-xs text-gray-500 font-normal">
                {loan.repayments?.length || 0} transaction(s)
              </span>
            </h3>

            {!loan.repayments || loan.repayments.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No repayments recorded yet for this loan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Repayment #</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Principal</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Interest</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Total Paid</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loan.repayments.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-blue-700">{r.repayment_number}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.repayment_date}</td>
                        <td className="px-3 py-2 text-right text-gray-900">{formatMoney(r.principal_amount)}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatMoney(r.interest_amount)}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">{formatMoney(r.total_amount)}</td>
                        <td className="px-3 py-2 text-center">
                          {r.status === "completed" ? (
                            <Badge variant="success">Completed</Badge>
                          ) : (
                            <Badge variant="muted">Reversed</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReverseRepayment(r.id)}
                              className="text-red-600 text-xs gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reverse
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Outstanding Principal & Debt Breakdown */}
        <div className="space-y-6">
          <Card className="p-5 shadow-sm space-y-4 bg-slate-50 border-slate-200">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Debt Position</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Contracted Principal:</span>
                <span className="font-bold text-gray-900">{formatMoney(loan.principal_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Principal Repaid:</span>
                <span className="font-bold text-emerald-700">{formatMoney(loan.total_principal_repaid)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium text-gray-700">Outstanding Debt:</span>
                <span className="font-bold text-amber-700 text-base">{formatMoney(loan.outstanding_principal)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-xs text-gray-500">
                <span>Interest Paid to Date:</span>
                <span className="font-semibold text-gray-700">{formatMoney(loan.total_interest_paid)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Receive Proceeds Modal */}
      {isProceedsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Receive Loan Proceeds</h3>
              <button type="button" onClick={() => setIsProceedsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveProceeds} className="space-y-4 text-sm">
              <p className="text-xs text-gray-600">
                Confirm receipt of principal funds ({formatMoney(loan.principal_amount)}) from {loan.lender_name}.
                This will book a Treasury inflow into the chosen account and activate the contract.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Destination Treasury Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={proceedsAccount}
                  onChange={(e) => setProceedsAccount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                >
                  <option value="">— Select Account —</option>
                  {financialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) - {acc.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsProceedsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={receiving}>
                  {receiving ? "Confirming..." : "Confirm Inflow Receipt"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Repay Modal */}
      {isRepayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Record Loan Repayment</h3>
              <button type="button" onClick={() => setIsRepayOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRepay} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Source Treasury Account <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={repayForm.financial_account_id}
                  onChange={(e) => setRepayForm({ ...repayForm, financial_account_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                >
                  <option value="">— Select Account —</option>
                  {financialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Principal Repayment (Max: {formatMoney(loan.outstanding_principal)}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  max={loan.outstanding_principal}
                  required
                  value={repayForm.principal_amount}
                  onChange={(e) => setRepayForm({ ...repayForm, principal_amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Interest Amount (Expense / Finance Cost)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  value={repayForm.interest_amount}
                  onChange={(e) => setRepayForm({ ...repayForm, interest_amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300 font-semibold text-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={repayForm.payment_method}
                  onChange={(e) => setRepayForm({ ...repayForm, payment_method: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                >
                  <option value="bank_transfer">Bank Transfer (BEFTN/RTGS)</option>
                  <option value="cash">Cash Tender</option>
                  <option value="cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. BEFTN-90214"
                  value={repayForm.reference_number}
                  onChange={(e) => setRepayForm({ ...repayForm, reference_number: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsRepayOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={repaying}>
                  {repaying ? "Processing..." : "Confirm Repayment"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

