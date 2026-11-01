"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CashFlowAccountMappingItem, CashFlowActivity } from "@/types/reporting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FolderTree,
  RefreshCw,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Save,
} from "lucide-react";

export default function CashFlowMappingsPage() {
  const [mappings, setMappings] = useState<CashFlowAccountMappingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getCashFlowAccountMappings();
      setMappings(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load Cash Flow account mappings.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateMapping = async (accountId: number, isCashEquiv: boolean, activity: CashFlowActivity) => {
    try {
      await adminApi.setCashFlowMapping({
        account_id: accountId,
        is_cash_equivalent: isCashEquiv,
        default_activity: activity,
      });
      setActionSuccess("Cash flow mapping updated successfully.");
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update cash flow mapping.");
    }
  };

  const cashEquivCount = mappings.filter((m) => m.is_cash_equivalent).length;
  const unclassifiedCount = mappings.filter((m) => m.default_activity === "unclassified").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cash Flow Mappings & Classifications
          </h1>
          <p className="text-sm text-slate-500">
            Designate liquid Cash & Cash Equivalent control accounts and map operating, investing, and financing default activities.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {actionSuccess && (
        <Alert variant="success" className="border-emerald-300 bg-emerald-50 text-emerald-800">
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          <div className="font-semibold">Error Loading Mappings</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Cash & Equivalents</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {cashEquivCount} Accounts
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Cash on hand, Prime Bank current, and liquid holdings
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Unclassified Accounts</div>
          <div className={`mt-1 text-2xl font-bold ${unclassifiedCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
            {unclassifiedCount} Accounts
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {unclassifiedCount === 0 ? "All active accounts categorized" : "Pending activity assignment"}
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase">Elimination Rule</div>
          <div className="mt-1 text-sm font-semibold text-blue-700 flex items-center gap-1.5">
            <ArrowRightLeft className="h-4 w-4" />
            Automatic Transfer Elimination
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Transfers strictly between 2 Cash Equivalents are eliminated
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Account Code & Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-center">Cash Equivalent</th>
                <th className="px-6 py-3">Default Activity Classification</th>
                <th className="px-6 py-3 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-mono font-bold text-slate-800">{m.account_code}</div>
                    <div className="text-xs text-slate-500">{m.account_name}</div>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 capitalize">
                    {m.account_type}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={m.is_cash_equivalent}
                      onChange={(e) => handleUpdateMapping(m.account_id ?? m.account, e.target.checked, m.default_activity)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      value={m.default_activity}
                      onChange={(e) => handleUpdateMapping(m.account_id ?? m.account, m.is_cash_equivalent, e.target.value as CashFlowActivity)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="unclassified">Unclassified</option>
                      <option value="operating">Operating Activity</option>
                      <option value="investing">Investing Activity</option>
                      <option value="financing">Financing Activity</option>
                      <option value="internal_transfer">Internal Transfer</option>
                    </select>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {m.is_cash_equivalent ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                        Cash Equivalent
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="text-slate-500 text-xs capitalize">
                        {m.default_activity}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
