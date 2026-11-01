"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft, Save, Coins } from "lucide-react";

export default function NewLoanContractPage() {
  const router = useRouter();
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    lender_name: "",
    lender_type: "individual",
    lender_contact: "",
    principal_amount: "",
    agreement_date: new Date().toISOString().split("T")[0],
    maturity_date: "",
    loan_classification: "pending_classification",
    interest_type: "unverified",
    interest_rate: "",
    repayment_frequency: "unspecified",
    contractual_terms: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const payload = {
        lender_name: form.lender_name,
        lender_type: form.lender_type,
        lender_contact: form.lender_contact,
        principal_amount: form.principal_amount,
        agreement_date: form.agreement_date,
        maturity_date: form.maturity_date || null,
        loan_classification: form.loan_classification,
        interest_type: form.interest_type,
        interest_rate: form.interest_rate ? form.interest_rate : null,
        repayment_frequency: form.repayment_frequency,
        contractual_terms: form.contractual_terms,
      };

      const loan = await adminApi.createLoanContract(payload);
      router.push(`/finance/loans/${loan.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) setError(err.message);
      else setError("Failed to create loan contract.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/finance/loans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Record Loan Agreement</h1>
          <p className="text-sm text-gray-500">
            Log a new business financing contract without assuming unverified interest or terms
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Lender / Creditor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Feroz Bhai, City Bank SME Wing"
                value={form.lender_name}
                onChange={(e) => setForm({ ...form, lender_name: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Lender Classification <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.lender_type}
                onChange={(e) => setForm({ ...form, lender_type: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">Individual / Director / Friendly</option>
                <option value="commercial_bank">Commercial Bank</option>
                <option value="financial_institution">NBFI / Financial Institution</option>
                <option value="other">Other Lender</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Principal Amount (BDT ৳) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={form.principal_amount}
                onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Loan Category
              </label>
              <select
                value={form.loan_classification}
                onChange={(e) => setForm({ ...form, loan_classification: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending_classification">Pending Classification</option>
                <option value="friendly">Friendly / Director Loan</option>
                <option value="short_term">Short-Term Working Capital (&lt; 1 Year)</option>
                <option value="long_term">Long-Term Financing (&gt; 1 Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Agreement Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.agreement_date}
                onChange={(e) => setForm({ ...form, agreement_date: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                value={form.maturity_date}
                onChange={(e) => setForm({ ...form, maturity_date: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Interest Structure
              </label>
              <select
                value={form.interest_type}
                onChange={(e) => setForm({ ...form, interest_type: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unverified">Unverified / Pending Terms</option>
                <option value="interest_free">Interest-Free (0%)</option>
                <option value="simple">Simple Interest</option>
                <option value="compound">Compound / Amortized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Leave blank if interest-free or unverified"
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Repayment Frequency
              </label>
              <select
                value={form.repayment_frequency}
                onChange={(e) => setForm({ ...form, repayment_frequency: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unspecified">Unspecified / Pending Agreement</option>
                <option value="lump_sum">Lump Sum at Maturity</option>
                <option value="monthly">Monthly Installments</option>
                <option value="quarterly">Quarterly Installments</option>
                <option value="on_demand">On Demand</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Lender Contact Details
              </label>
              <input
                type="text"
                placeholder="Phone, email, or institutional address"
                value={form.lender_contact}
                onChange={(e) => setForm({ ...form, lender_contact: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                Contractual Terms & Conditions
              </label>
              <textarea
                rows={3}
                placeholder="Terms of financing, collateral, repayment stipulations..."
                value={form.contractual_terms}
                onChange={(e) => setForm({ ...form, contractual_terms: e.target.value })}
                className="w-full text-sm border rounded-lg px-3 py-2.5 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/finance/loans">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Record Loan Agreement"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

