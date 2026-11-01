"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { TreasuryDashboardSummary } from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Landmark,
  Wallet,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  CircleDollarSign,
  Truck,
  Scale,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Building2,
  Clock,
  Layers,
} from "lucide-react";

export default function TreasuryDashboardPage() {
  const [summary, setSummary] = useState<TreasuryDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getTreasuryDashboard();
      setSummary(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load treasury dashboard summary.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAccountBadge = (type: string) => {
    switch (type) {
      case "bank":
        return <Badge variant="primary">Bank Account</Badge>;
      case "cash":
        return <Badge variant="success">Cash Till / Safe</Badge>;
      case "mfs":
        return <Badge variant="warning">MFS Merchant</Badge>;
      case "clearing":
        return <Badge variant="muted">Clearing Account</Badge>;
      default:
        return <Badge variant="muted">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Treasury & Settlement Dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Authoritative cashbook, commercial bank balances, MFS wallets, and clearing reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/treasury/transfers">
            <Button size="sm" className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              Transfer Funds
            </Button>
          </Link>
          <Link href="/treasury/customer-receipts">
            <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Customer Receipt
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Error Loading Treasury Data">
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-l-4 border-l-emerald-600 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Liquid Funds
            </span>
            <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {formatMoney(summary?.total_liquid_funds || "0.00")}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Cash, Bank & MFS ({summary?.accounts?.length || 0} accounts)
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Bank Balances
            </span>
            <span className="rounded-full bg-blue-50 text-blue-600 p-2">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {formatMoney(summary?.breakdown?.bank || "0.00")}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Commercial bank accounts
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Cash Drawers & Safes
            </span>
            <span className="rounded-full bg-amber-50 text-amber-600 p-2">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {formatMoney(summary?.breakdown?.cash || "0.00")}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Physical retail tills & safe
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-600 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              MFS Merchant Wallets
            </span>
            <span className="rounded-full bg-purple-50 text-purple-600 p-2">
              <CircleDollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {formatMoney(summary?.breakdown?.mfs || "0.00")}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            bKash & Nagad merchant accounts
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-neutral-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              In-Transit Clearing
            </span>
            <span className="rounded-full bg-neutral-100 text-neutral-700 p-2">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {formatMoney(summary?.breakdown?.clearing || "0.00")}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            SSL & Courier COD pending payout
          </p>
        </Card>
      </div>

      {/* Pending Approvals & Settlement Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5 bg-white border border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Pending Supervisory Approvals
            </h2>
            <Badge variant="warning">
              {summary?.pending_approvals?.total || 0} Actions Required
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-4 w-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-800">
                  Fund Transfers Pending Approval
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-900">
                  {summary?.pending_approvals?.transfers || 0}
                </span>
                <Link href="/treasury/transfers">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Review
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-800">
                  Supplier Disbursements Pending Approval
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-900">
                  {summary?.pending_approvals?.disbursements || 0}
                </span>
                <Link href="/treasury/supplier-payments">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Review
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-800">
                  Cash Count Reconciliations Submitted
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-900">
                  {summary?.pending_approvals?.cash_counts || 0}
                </span>
                <Link href="/treasury/reconciliation/cash">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Review
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-600" />
              Settlement & Reconciliation Status
            </h2>
            <Link href="/treasury/reconciliation/bank">
              <Button variant="ghost" size="sm" className="h-7 text-xs flex items-center gap-1">
                Bank Recon <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="h-4 w-4 text-neutral-600" />
                <div>
                  <span className="text-sm font-medium text-neutral-800 block">
                    SSLCOMMERZ Gateway Payouts
                  </span>
                  <span className="text-xs text-neutral-500">
                    {summary?.settlements_summary?.draft_gateway_batches || 0} Draft batches pending confirmation
                  </span>
                </div>
              </div>
              <Link href="/treasury/settlements/gateway">
                <Button variant="secondary" size="sm" className="h-7 text-xs">
                  Inspect
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-neutral-600" />
                <div>
                  <span className="text-sm font-medium text-neutral-800 block">
                    Steadfast & Pathao COD Remittance
                  </span>
                  <span className="text-xs text-neutral-500">
                    {summary?.settlements_summary?.draft_courier_sheets || 0} Remittance sheets pending settlement
                  </span>
                </div>
              </div>
              <Link href="/treasury/settlements/courier">
                <Button variant="secondary" size="sm" className="h-7 text-xs">
                  Inspect
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
              <div className="flex items-center gap-3">
                <Scale className="h-4 w-4 text-neutral-600" />
                <div>
                  <span className="text-sm font-medium text-neutral-800 block">
                    Commercial Bank Statement Recon
                  </span>
                  <span className="text-xs text-neutral-500">
                    Matching bank statements against Treasury transactions
                  </span>
                </div>
              </div>
              <Link href="/treasury/reconciliation/bank">
                <Button variant="secondary" size="sm" className="h-7 text-xs">
                  Reconcile
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Accounts Table */}
      <Card className="bg-white border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Financial Repositories & Cashbooks
            </h2>
            <p className="text-xs text-neutral-500">
              Real-time balance calculated dynamically from immutable operational transactions.
            </p>
          </div>
          <Link href="/treasury/accounts">
            <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Manage Accounts
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">Account Code</th>
                <th className="px-4 py-3">Account Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Identifier / Masked No</th>
                <th className="px-4 py-3 text-right">Operational Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    Loading financial repositories...
                  </td>
                </tr>
              ) : summary?.accounts && summary.accounts.length > 0 ? (
                summary.accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {acc.code}
                    </td>
                    <td className="px-4 py-3 text-neutral-800">
                      {acc.name}
                    </td>
                    <td className="px-4 py-3">
                      {getAccountBadge(acc.type)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                      {acc.masked_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">
                      {formatMoney(acc.balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {acc.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/treasury/accounts/${acc.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Cashbook
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    No financial accounts registered yet.
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
