"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft, Save, TrendingDown } from "lucide-react";

export default function NewOwnerDrawingPage() {
  const router = useRouter();
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [loadingAccs, setLoadingAccs] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    recipient_name: "",
    recipient_role: "Owner / Partner",
    amount: "",
    drawing_date: new Date().toISOString().split("T")[0],
    financial_account: "",
    payment_method: "bank_transfer",
    reason: "",
    notes: "",
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
        recipient_name: form.recipient_name,
        recipient_role: form.recipient_role,
        amount: form.amount,
        drawing_date: form.drawing_date,
        financial_account: Number(form.financial_account),
        payment_method: form.payment_method,
        reason: form.reason,
        notes: form.notes,
      };

      const res = await adminApi.createOwnerDrawing(payload);
      router.push(`/finance/owner-drawings/${res.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to create owner drawing request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/finance/owner-drawings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Request Owner Drawing</h1>
          <p className="text-sm text-gray-500">
            Log an owner or partner equity withdrawal (strictly segregated from operating expenditures)
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Recipient / Beneficiary Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Rahman"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Beneficiary Role / Relationship
              </label>
              <input
                type="text"
                value={form.recipient_role}
                onChange={(e) => setForm({ ...form, recipient_role: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Drawing Amount (BDT ৳) <span className="text-red-500">*</span>
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
                Disbursement Financial Account <span className="text-red-500">*</span>
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
                Drawing Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.drawing_date}
                onChange={(e) => setForm({ ...form, drawing_date: e.target.value })}
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
                <option value="cash">Cash Outflow</option>
                <option value="cheque">Bank Cheque</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Reason / Business Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State the purpose of this equity withdrawal..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Internal Remarks</label>
              <textarea
                rows={2}
                placeholder="Optional internal remarks for the approving manager..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/finance/owner-drawings">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Submitting..." : "Submit Drawing Request"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

