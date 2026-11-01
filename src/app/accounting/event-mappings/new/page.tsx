"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CommercialEventType } from "@/types/events";
import { Account } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft, Save } from "lucide-react";

const EVENT_TYPE_OPTIONS: { value: CommercialEventType; label: string; defaultDebit: string; defaultCredit: string }[] = [
  { value: "sales.invoice_posted", label: "Sales Invoice Posted (AR / Revenue)", defaultDebit: "1100", defaultCredit: "4000" },
  { value: "sales.cogs_posted", label: "Sales COGS Recognition (COGS / Inventory)", defaultDebit: "5000", defaultCredit: "1200" },
  { value: "sales.credit_note_posted", label: "Sales Credit Note (Returns / AR)", defaultDebit: "6100", defaultCredit: "1100" },
  { value: "procurement.purchase_bill_posted", label: "Procurement Purchase Bill (Inventory / AP)", defaultDebit: "1200", defaultCredit: "2000" },
  { value: "procurement.landed_cost_posted", label: "Procurement Landed Cost Capitalized (Inventory / Clearing)", defaultDebit: "1200", defaultCredit: "2000" },
  { value: "inventory.adjustment_posted", label: "Inventory Stock Adjustment (Inventory / Gain or Loss)", defaultDebit: "1200", defaultCredit: "4000" },
  { value: "treasury.customer_receipt_completed", label: "Customer Receipt (Treasury Account / AR)", defaultDebit: "", defaultCredit: "1100" },
  { value: "treasury.supplier_disbursement_completed", label: "Supplier Disbursement (AP / Treasury Account)", defaultDebit: "2000", defaultCredit: "" },
  { value: "treasury.fund_transfer_completed", label: "Internal Fund Transfer (Destination / Source Account)", defaultDebit: "", defaultCredit: "" },
  { value: "treasury.gateway_settlement_completed", label: "Gateway Settlement (Bank / Clearing)", defaultDebit: "", defaultCredit: "1100" },
  { value: "treasury.courier_remittance_completed", label: "Courier COD Remittance (Bank / Clearing)", defaultDebit: "", defaultCredit: "1100" },
  { value: "treasury.cash_variance_approved", label: "Cash Till Variance (Shortage / Overage)", defaultDebit: "6100", defaultCredit: "4000" },
  { value: "treasury.bank_variance_approved", label: "Bank Statement Variance (Expense / Income)", defaultDebit: "6100", defaultCredit: "4000" },
  { value: "expenses.expense_disbursement_completed", label: "Expense Disbursement (Expense Account / Treasury)", defaultDebit: "6100", defaultCredit: "" },
  { value: "expenses.capital_contribution_received", label: "Capital Contribution Received (Treasury / Owner Equity)", defaultDebit: "", defaultCredit: "3000" },
  { value: "expenses.loan_proceeds_received", label: "Loan Proceeds Received (Treasury / Loan Liability)", defaultDebit: "", defaultCredit: "2100" },
  { value: "expenses.loan_repayment_completed", label: "Loan Repayment Completed (Loan Liability / Treasury)", defaultDebit: "2100", defaultCredit: "" },
  { value: "expenses.owner_drawing_completed", label: "Owner Drawing Completed (Owner Drawings / Treasury)", defaultDebit: "3100", defaultCredit: "" },
];

export default function NewEventMappingPage() {
  const router = useRouter();
  const [eventType, setEventType] = useState<CommercialEventType>("sales.invoice_posted");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [debitAccountId, setDebitAccountId] = useState<string>("");
  const [creditAccountId, setCreditAccountId] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<string>("");
  const [effectiveTo, setEffectiveTo] = useState<string>("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await adminApi.getAccounts({ is_group: false });
        const list = Array.isArray(res) ? res : (res as any)?.results || [];
        setAccounts(list);
      } catch (err) {
        console.error("Failed to load accounts", err);
      }
    }
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a descriptive name for this mapping rule.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.createEventMapping({
        event_type: eventType,
        name: name.trim(),
        description: description.trim(),
        debit_account_id: debitAccountId ? Number(debitAccountId) : null,
        credit_account_id: creditAccountId ? Number(creditAccountId) : null,
        effective_from: effectiveFrom || null,
        effective_to: effectiveTo || null,
      });

      router.push(`/accounting/event-mappings/${res.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create event mapping.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Link href="/accounting/event-mappings" className="hover:text-neutral-900 transition-colors">
              Event Mappings
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">New Rule</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Define Accounting Mapping Rule</h1>
        </div>
        <Link href="/accounting/event-mappings">
          <Button variant="secondary" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6 border border-neutral-200 bg-white">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Canonical Event Type *</label>
              <select
                value={eventType}
                onChange={(e) => {
                  const val = e.target.value as CommercialEventType;
                  setEventType(val);
                  const opt = EVENT_TYPE_OPTIONS.find((o) => o.value === val);
                  if (opt) setName(opt.label);
                }}
                className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Rule Name *</label>
              <input
                type="text"
                placeholder="e.g. Sales Invoices to Accounts Receivable and Revenue"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description / Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Business explanation and policy rationale..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Default Debit Account (DR)
                </label>
                <select
                  value={debitAccountId}
                  onChange={(e) => setDebitAccountId(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="">-- Dynamic / From Subledger Mapping --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name} ({acc.account_type})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-neutral-400 mt-0.5 block">
                  Leave dynamic for Treasury receipt/disbursement events.
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Default Credit Account (CR)
                </label>
                <select
                  value={creditAccountId}
                  onChange={(e) => setCreditAccountId(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="">-- Dynamic / From Subledger Mapping --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name} ({acc.account_type})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-neutral-400 mt-0.5 block">
                  Leave dynamic for Treasury receipt/disbursement events.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Effective From Date</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Effective To Date</label>
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
            <Link href="/accounting/event-mappings">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {loading ? "Creating..." : "Save Draft Mapping Rule"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

