"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseCategory } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft, Save, Receipt } from "lucide-react";

export default function NewExpenseVoucherPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    category: "",
    payee_name: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoadingCats(true);
        const data = await adminApi.getExpenseCategories({ is_active: true });
        setCategories(data);
      } catch {
        setError("Failed to load active expense categories.");
      } finally {
        setLoadingCats(false);
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
        category: Number(form.category),
        payee_name: form.payee_name,
        amount: form.amount,
        expense_date: form.expense_date,
        reference_number: form.reference_number,
        description: form.description,
        notes: form.notes,
      };

      const voucher = await adminApi.createExpenseVoucher(payload);
      router.push(`/expenses/vouchers/${voucher.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to create expense voucher.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/expenses/vouchers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Expense Voucher</h1>
          <p className="text-sm text-gray-500">
            Record a new operational business expenditure for review, approval, and payout
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingCats}
              >
                <option value="">— Select Category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Payee / Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Desh Stationery Mart, City Power Co"
                value={form.payee_name}
                onChange={(e) => setForm({ ...form, payee_name: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Amount (BDT ৳) <span className="text-red-500">*</span>
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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                External Reference / Vendor Invoice #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-90412"
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Purpose & Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Detailed business justification of items procured or services rendered..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Internal Operational Notes
              </label>
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
            <Link href="/expenses/vouchers">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Creating Draft..." : "Create Voucher Draft"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

