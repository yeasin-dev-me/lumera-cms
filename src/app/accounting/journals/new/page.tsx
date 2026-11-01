"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Account, JournalEntryCreatePayload, JournalLineInput, JournalType } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Send,
} from "lucide-react";

interface FormLine {
  id: string;
  account_id: number | "";
  description: string;
  debit: string;
  credit: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Header State
  const [journalDate, setJournalDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [journalType, setJournalType] = useState<JournalType>("general");
  const [description, setDescription] = useState<string>("");
  const [reference, setReference] = useState<string>("");

  // Lines State
  const [lines, setLines] = useState<FormLine[]>([
    { id: "1", account_id: "", description: "", debit: "", credit: "" },
    { id: "2", account_id: "", description: "", debit: "", credit: "" },
  ]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await adminApi.getAccounts({ is_active: true, page_size: 300 });
        const list = res.results || (res as unknown as Account[]) || [];
        // Filter to only posting accounts
        setAccounts(list.filter((a) => a.allow_posting));
      } catch (err) {
        console.error("Failed to load accounts", err);
      }
    }
    fetchAccounts();
  }, []);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: String(Date.now()), account_id: "", description: "", debit: "", credit: "" },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      alert("A double-entry journal requires at least two lines.");
      return;
    }
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, field: keyof FormLine, value: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // If user inputs debit, auto-clear credit and vice versa
      if (field === "debit" && value && Number(value) > 0) {
        next[index].credit = "";
      } else if (field === "credit" && value && Number(value) > 0) {
        next[index].debit = "";
      }

      return next;
    });
  };

  // Computations
  const totalDebit = lines.reduce((acc, line) => acc + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.005 && totalDebit > 0;

  const formatMoney = (val: number) => {
    return `৳${val.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSave = async (submitAfterSave: boolean = false) => {
    if (!description.trim()) {
      setError("Journal Description / Memo is required.");
      return;
    }

    if (lines.length < 2) {
      setError("A journal voucher must have at least 2 lines.");
      return;
    }

    // Check account selection
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.account_id) {
        setError(`Line #${i + 1} is missing an account.`);
        return;
      }
      const dr = Number(l.debit) || 0;
      const cr = Number(l.credit) || 0;
      if (dr <= 0 && cr <= 0) {
        setError(`Line #${i + 1} must have either a Debit or Credit amount greater than 0.`);
        return;
      }
    }

    if (!isBalanced) {
      setError(`Journal is not balanced! Total Debits (${formatMoney(totalDebit)}) must equal Total Credits (${formatMoney(totalCredit)}).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: JournalEntryCreatePayload = {
        journal_date: journalDate,
        journal_type: journalType,
        description: description.trim(),
        reference: reference.trim() || undefined,
        currency: "BDT",
        lines: lines.map((l) => ({
          account_id: Number(l.account_id),
          description: l.description.trim() || undefined,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      };

      const created = await adminApi.createJournal(payload);

      if (submitAfterSave) {
        await adminApi.submitJournal(created.id);
      }

      router.push(`/accounting/journals/${created.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message || JSON.stringify(err.details));
      } else {
        setError("Failed to create journal entry.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accounting/journals">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Journals
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Journal Entry</h1>
            <p className="text-sm text-gray-500">Create a double-entry journal voucher draft</p>
          </div>
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Balanced (Σ Dr = Σ Cr)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
              <AlertCircle className="h-4 w-4" />
              Difference: {formatMoney(difference)}
            </div>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Header Fields Card */}
      <Card className="p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Voucher Header</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Journal Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Journal Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={journalDate}
              onChange={(e) => setJournalDate(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Journal Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Journal Type <span className="text-red-500">*</span>
            </label>
            <select
              value={journalType}
              onChange={(e) => setJournalType(e.target.value as JournalType)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            >
              <option value="general">General Journal</option>
              <option value="adjustment">Adjustment Journal</option>
              <option value="opening_balance">Opening Balance</option>
              <option value="closing">Closing Journal</option>
              <option value="reversal">Reversal Journal</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">External Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-1002, CHQ-4819"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Base Currency</label>
            <input
              type="text"
              value="BDT (৳)"
              disabled
              className="w-full px-3 py-1.5 text-sm border border-gray-200 bg-gray-50 rounded-lg text-gray-500 font-mono"
            />
          </div>

          {/* Description / Memo */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description / Business Memo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the economic substance and justification of this accounting entry..."
              required
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Multi-Line Journal Items */}
      <Card className="overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Journal Lines</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Each row must specify an active posting account and either a debit or credit amount.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addLine} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100/70 text-gray-600 text-xs uppercase font-medium">
              <tr>
                <th className="py-2.5 px-3 text-left w-12">#</th>
                <th className="py-2.5 px-3 text-left w-72">Account</th>
                <th className="py-2.5 px-3 text-left">Line Description (Optional)</th>
                <th className="py-2.5 px-3 text-right w-44">Debit (BDT)</th>
                <th className="py-2.5 px-3 text-right w-44">Credit (BDT)</th>
                <th className="py-2.5 px-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {lines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <select
                      value={line.account_id}
                      onChange={(e) => updateLine(idx, "account_id", e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Posting Account --</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name} ({a.account_type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(idx, "description", e.target.value)}
                      placeholder="Line memo (optional)"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit}
                      onChange={(e) => updateLine(idx, "debit", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit}
                      onChange={(e) => updateLine(idx, "credit", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length <= 2}
                      className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Running Totals Footer */}
            <tfoot className="bg-gray-50/80 font-semibold border-t-2 border-gray-200">
              <tr>
                <td colSpan={3} className="py-3 px-3 text-right text-gray-700 text-xs uppercase tracking-wider">
                  Totals & Equilibrium Check:
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-gray-900">
                  {formatMoney(totalDebit)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-gray-900">
                  {formatMoney(totalCredit)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-gray-500">
          <p>
            * Submitted entries enter the maker-checker approval queue. Only approved journals in open accounting periods
            can be posted.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/accounting/journals">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="secondary"
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading || !isBalanced}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => handleSave(true)}
            disabled={loading || !isBalanced}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? "Submitting..." : "Save & Submit for Approval"}
          </Button>
        </div>
      </div>
    </div>
  );
}

