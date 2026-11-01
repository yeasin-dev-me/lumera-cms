"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft, Save, PiggyBank } from "lucide-react";

export default function NewCapitalContributionPage() {
  const router = useRouter();
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [loadingAccs, setLoadingAccs] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    contributor_name: "",
    contributor_type: "owner",
    contributor_contact: "",
    amount: "",
    contribution_date: new Date().toISOString().split("T")[0],
    financial_account: "",
    payment_method: "bank_transfer",
    reference_note: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoadingAccs(true);
        const data = await adminApi.getFinancialAccounts({ is_active: true });
        setFinancialAccounts(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, financial_account: String(data[0].id) }));
        }
      } catch {
        setError("Failed to load active treasury accounts.");
      } finally {
        setLoadingAccs(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        contributor_name: form.contributor_name,
        contributor_type: form.contributor_type,
        contributor_contact: form.contributor_contact,
        amount: form.amount,
        contribution_date: form.contribution_date,
        financial_account: Number(form.financial_account),
        payment_method: form.payment_method,
        reference_note: form.reference_note,
      };

      const res = await adminApi.createCapitalContribution(payload);
      router.push(`/finance/capital/${res.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to record capital contribution.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/finance/capital">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Record Capital Contribution</h1>
          <p className="text-sm text-gray-500">
            Log a new business equity or partner capital deposit awaiting verification and Treasury inflow
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Contributor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Rahman"
                value={form.contributor_name}
                onChange={(e) => setForm({ ...form, contributor_name: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Contributor Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.contributor_type}
                onChange={(e) => setForm({ ...form, contributor_type: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="owner">Business Owner</option>
                <option value="partner">Equity Partner</option>
                <option value="investor">External Investor</option>
                <option value="other">Other Contributor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Contribution Amount (BDT ৳) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Deposit Financial Account <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.financial_account}
                onChange={(e) => setForm({ ...form, financial_account: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingAccs}
              >
                <option value="">— Select Account —</option>
                {financialAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.code}) - {acc.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Contribution Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.contribution_date}
                onChange={(e) => setForm({ ...form, contribution_date: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank_transfer">Bank Transfer (BEFTN/RTGS)</option>
                <option value="cash">Cash Deposit</option>
                <option value="cheque">Bank Cheque</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Contributor Contact Details
              </label>
              <input
                type="text"
                placeholder="Phone number, email, or National ID"
                value={form.contributor_contact}
                onChange={(e) => setForm({ ...form, contributor_contact: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Reference Notes / Background
              </label>
              <textarea
                rows={3}
                placeholder="Describe purpose of capital injection (e.g. initial funding, working capital top-up)..."
                value={form.reference_note}
                onChange={(e) => setForm({ ...form, reference_note: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/finance/capital">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Record Pending Contribution"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

