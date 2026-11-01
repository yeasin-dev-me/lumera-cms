"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountCashbookResponse, FinancialAccount } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ArrowLeft,
  RefreshCw,
  Landmark,
  Building2,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Layers,
} from "lucide-react";

export default function AccountCashbookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const accountId = resolvedParams.id;

  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [cashbook, setCashbook] = useState<AccountCashbookResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [accRes, cbRes] = await Promise.all([
        adminApi.getFinancialAccount(accountId),
        adminApi.getAccountCashbook(accountId, {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      ]);
      setAccount(accRes);
      setCashbook(cbRes);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load cashbook ledger.");
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/treasury/accounts">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {account?.name || "Cashbook Ledger"}
              </h1>
              <Badge variant="muted">{account?.code}</Badge>
            </div>
            <p className="text-sm text-neutral-500">
              Authoritative transaction subledger and chronological balance history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/treasury/transfers">
            <Button size="sm">Initiate Transfer</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Account Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs uppercase text-neutral-500 font-semibold">Account Type</span>
          <div className="mt-1 text-base font-bold text-neutral-900 capitalize">
            {account?.account_type || "—"}
          </div>
          <span className="text-xs text-neutral-500">{account?.currency || "BDT"} Operating Account</span>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs uppercase text-neutral-500 font-semibold">Masked Account No</span>
          <div className="mt-1 text-base font-mono font-bold text-neutral-900">
            {account?.masked_account_number || "—"}
          </div>
          <span className="text-xs text-neutral-500">{account?.bank_name || account?.provider || "Direct Drawer"}</span>
        </Card>

        <Card className="p-4 bg-white border border-neutral-200">
          <span className="text-xs uppercase text-neutral-500 font-semibold">Opening Balance</span>
          <div className="mt-1 text-base font-mono font-bold text-neutral-700">
            {formatMoney(account?.opening_balance || "0.00")}
          </div>
          <span className="text-xs text-neutral-500">Initial migration baseline</span>
        </Card>

        <Card className="p-4 bg-white border-l-4 border-l-emerald-600 border border-neutral-200">
          <span className="text-xs uppercase text-neutral-500 font-semibold">Current Balance</span>
          <div className="mt-1 text-xl font-mono font-bold text-emerald-700">
            {formatMoney(cashbook?.current_balance || account?.current_balance || "0.00")}
          </div>
          <span className="text-xs text-neutral-500">Live operational ledger total</span>
        </Card>
      </div>

      {/* Date Filter */}
      <Card className="p-4 bg-white border border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
            <Filter className="h-4 w-4" />
            <span>Filter Transaction Date:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              />
            </div>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-8 text-xs text-neutral-600"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Cashbook Transaction Ledger Table */}
      <Card className="bg-white border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Cashbook Movements ({cashbook?.transactions?.length || 0} entries)
            </h2>
            <p className="text-xs text-neutral-500">
              Append-only immutable record. Reversals appear as contra movements.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Tx Date & Time</th>
                <th className="px-4 py-3">Tx Number</th>
                <th className="px-4 py-3">Source & Reference</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Inflow (+)</th>
                <th className="px-4 py-3 text-right">Outflow (-)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    Loading cashbook transactions...
                  </td>
                </tr>
              ) : cashbook?.transactions && cashbook.transactions.length > 0 ? (
                cashbook.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 text-xs text-neutral-600 font-mono whitespace-nowrap">
                      {new Date(tx.effective_at).toLocaleString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-neutral-900">
                      {tx.transaction_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold block uppercase text-neutral-800">
                        {tx.source_type.replace(/_/g, " ")}
                      </span>
                      {tx.source_reference && (
                        <span className="text-xs text-neutral-500 font-mono">
                          Ref: {tx.source_reference}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-700 max-w-xs truncate">
                      {tx.description}
                      {tx.external_reference && (
                        <span className="block text-neutral-400 font-mono text-[11px]">
                          Ext: {tx.external_reference}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {tx.direction === "inflow" ? `+${formatMoney(tx.amount)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      {tx.direction === "outflow" ? `-${formatMoney(tx.amount)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          tx.status === "finalized"
                            ? "success"
                            : tx.status === "reversed"
                            ? "danger"
                            : "muted"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    No cashbook movements recorded for this account.
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
