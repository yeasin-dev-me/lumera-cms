"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Account, GeneralLedgerEntry } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  FolderTree,
  FileSpreadsheet,
  Trash2,
  PowerOff,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Receipt,
} from "lucide-react";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [activity, setActivity] = useState<{
    account: any;
    total_debit: string;
    total_credit: string;
    closing_balance: string;
    entries_count: number;
    entries: GeneralLedgerEntry[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadAccountData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [acc, act] = await Promise.all([
        adminApi.getAccount(id),
        adminApi.getAccountActivity(id),
      ]);
      setAccount(acc);
      setActivity(act);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load account details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  const handleDeactivate = async () => {
    if (!account) return;
    if (!confirm(`Are you sure you want to toggle active status for account [${account.code}] ${account.name}?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      const res = await adminApi.deactivateAccount(account.id);
      setActionMessage(res.message);
      setAccount(res.account);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to deactivate account.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    if (!confirm(`Are you sure you want to PERMANENTLY delete account [${account.code}] ${account.name}? This cannot be undone.`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.deleteAccount(account.id);
      router.push("/accounting/chart-of-accounts");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to delete account. Accounts with postings or children cannot be deleted.");
      }
      setActionLoading(false);
    }
  };

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && !account) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center py-20 text-gray-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading account details...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/accounting/chart-of-accounts">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to COA
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                [{account?.code}] {account?.name}
              </h1>
              {account?.is_group && (
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 font-semibold uppercase">
                  Group Account
                </span>
              )}
              {account?.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="muted">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              Classification: <span className="font-semibold">{account?.account_type}</span> | Normal Balance:{" "}
              <span className="font-semibold uppercase font-mono">{account?.normal_balance}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href={`/accounting/general-ledger?account_id=${account?.id}`}>
            <Button variant="secondary" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              General Ledger
            </Button>
          </Link>

          {!account?.is_system && (
            <>
              <Button
                variant="secondary"
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="gap-2 text-amber-600 hover:text-amber-700"
              >
                <PowerOff className="h-4 w-4" />
                {account?.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleDelete}
                disabled={actionLoading}
                className="gap-2 text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</p>
          <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{account?.account_type}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Normal: <span className="font-mono uppercase font-semibold">{account?.normal_balance}</span>
          </p>
        </Card>

        <Card className="p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Posting Status</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {account?.allow_posting ? "Direct Posting Allowed" : "Posting Disabled"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{account?.is_group ? "Group node" : "Detail ledger node"}</p>
        </Card>

        <Card className="p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Account</p>
          <p className="text-lg font-bold text-gray-900 mt-1 truncate">
            {account?.parent_name ? `[${account.parent_code}] ${account.parent_name}` : "None (Root Group)"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Hierarchical position</p>
        </Card>

        <Card className="p-4 shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Balance</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            {activity ? formatMoney(activity.closing_balance) : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Dr: {activity ? formatMoney(activity.total_debit) : "0"} | Cr:{" "}
            {activity ? formatMoney(activity.total_credit) : "0"}
          </p>
        </Card>
      </div>

      {/* Description */}
      {account?.description && (
        <Card className="p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description / Notes</h4>
          <p className="text-sm text-gray-700">{account.description}</p>
        </Card>
      )}

      {/* Recent Ledger Postings Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Ledger Activity</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chronological journal lines posted to this specific account</p>
          </div>
          <Link
            href={`/accounting/general-ledger?account_id=${account?.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Full Ledger View →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Journal #</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Debit</th>
                <th className="px-5 py-3 text-right font-medium">Credit</th>
                <th className="px-5 py-3 text-right font-medium">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {activity && activity.entries.length > 0 ? (
                activity.entries.map((ent) => (
                  <tr key={ent.line_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{ent.journal_date}</td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-blue-600">
                      <Link href={`/accounting/journals/${ent.journal_id}`} className="hover:underline">
                        {ent.journal_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{ent.description}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900">
                      {Number(ent.debit) > 0 ? formatMoney(ent.debit) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900">
                      {Number(ent.credit) > 0 ? formatMoney(ent.credit) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-gray-900">
                      {formatMoney(ent.running_balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No journal postings recorded for this account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

