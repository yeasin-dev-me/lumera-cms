"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Account, AccountCreatePayload, AccountType, NormalBalance } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft, Save, FolderTree } from "lucide-react";

export default function NewAccountPage() {
  const router = useRouter();
  const [existingAccounts, setExistingAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [accountType, setAccountType] = useState<AccountType>("asset");
  const [normalBalance, setNormalBalance] = useState<NormalBalance>("debit");
  const [parent, setParent] = useState<number | null>(null);
  const [isGroup, setIsGroup] = useState<boolean>(false);
  const [allowPosting, setAllowPosting] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setInitialLoading(true);
        const res = await adminApi.getAccounts({ page_size: 200 });
        setExistingAccounts(res.results || (res as unknown as Account[]) || []);
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  // Auto-set default normal balance based on account type
  const handleTypeChange = (type: AccountType) => {
    setAccountType(type);
    if (type === "asset" || type === "expense") {
      setNormalBalance("debit");
    } else {
      setNormalBalance("credit");
    }
  };

  const handleGroupChange = (checked: boolean) => {
    setIsGroup(checked);
    if (checked) {
      setAllowPosting(false);
    } else {
      setAllowPosting(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Account Code and Name are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload: AccountCreatePayload = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        account_type: accountType,
        normal_balance: normalBalance,
        parent: parent ? Number(parent) : null,
        is_group: isGroup,
        allow_posting: allowPosting,
        sort_order: Number(sortOrder) || 0,
      };

      const created = await adminApi.createAccount(payload);
      router.push(`/accounting/chart-of-accounts/${created.id}`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message || JSON.stringify(err.details));
      } else {
        setError("Failed to create account. Please verify input data.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accounting/chart-of-accounts">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to COA
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Account</h1>
            <p className="text-sm text-gray-500">Define a new ledger node in the Chart of Accounts</p>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 1010 or 1010-01"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Unique hierarchical alphanumeric identifier</p>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Petty Cash Dhaka Warehouse"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Account Classification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classification <span className="text-red-500">*</span>
              </label>
              <select
                value={accountType}
                onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="asset">Asset (1xxx)</option>
                <option value="liability">Liability (2xxx)</option>
                <option value="equity">Equity (3xxx)</option>
                <option value="revenue">Revenue / Income (4xxx)</option>
                <option value="expense">Expense (5xxx)</option>
              </select>
            </div>

            {/* Normal Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Normal Balance <span className="text-red-500">*</span>
              </label>
              <select
                value={normalBalance}
                onChange={(e) => setNormalBalance(e.target.value as NormalBalance)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              >
                <option value="debit">DEBIT</option>
                <option value="credit">CREDIT</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Assets and Expenses normally carry Debit; Liabilities, Equity, and Revenue carry Credit.
              </p>
            </div>

            {/* Parent Account */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Group Account (Optional)</label>
              <select
                value={parent || ""}
                onChange={(e) => setParent(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">(None - Top-level Root Group)</option>
                {existingAccounts
                  .filter((a) => a.is_group)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name} ({a.account_type.toUpperCase()})
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Select an existing group account to nest this account under</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Operational purpose and reconciliation notes..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Flags */}
            <div className="flex items-center gap-6 md:col-span-2 border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={(e) => handleGroupChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-900">Is Group Account</span>
                <span className="text-xs text-gray-500">(Can have child accounts; typically disables direct journal posting)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPosting}
                  onChange={(e) => setAllowPosting(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-900">Allow Direct Posting</span>
                <span className="text-xs text-gray-500">(Can receive journal entry lines)</span>
              </label>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Link href="/accounting/chart-of-accounts">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Creating..." : "Save Account"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

