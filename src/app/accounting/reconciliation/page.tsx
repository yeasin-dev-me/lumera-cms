"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ConsolidatedReconciliationReport, SubledgerReconciliationSummary } from "@/types/events";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Receipt,
  Boxes,
  ArrowRight,
} from "lucide-react";

export default function SubledgerReconciliationPage() {
  const [report, setReport] = useState<ConsolidatedReconciliationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getReconciliationReport();
      setReport(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to generate subledger reconciliation report.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const renderModuleCard = (title: string, data?: SubledgerReconciliationSummary) => {
    if (!data) return null;
    return (
      <Card className="p-5 border border-neutral-200 bg-white space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            {data.gl_account_code && (
              <span className="text-xs font-mono text-neutral-400">
                GL Account: [{data.gl_account_code}] {data.gl_account_name}
              </span>
            )}
          </div>
          {data.is_reconciled ? (
            <Badge variant="success">Reconciled</Badge>
          ) : (
            <Badge variant="danger">Variance</Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-xs">
          <div>
            <span className="text-neutral-500 block">GL Balance</span>
            <span className="font-mono font-semibold text-neutral-900 text-sm">
              ৳{Number(data.gl_balance || data.total_gl_balance || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Subledger Total</span>
            <span className="font-mono font-semibold text-neutral-900 text-sm">
              ৳{Number(data.subledger_balance || data.total_subledger_balance || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Discrepancy</span>
            <span
              className={`font-mono font-bold text-sm ${
                data.difference === "0.00" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              ৳{Number(data.difference || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Link href="/accounting" className="hover:text-neutral-900 transition-colors">
              Accounting
            </Link>
            <span>/</span>
            <Link href="/accounting/events" className="hover:text-neutral-900 transition-colors">
              Events
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Reconciliation</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">General Ledger Subledger Reconciliation</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Authoritative multi-domain mathematical proof ensuring operational subledgers reconcile to Control Accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadReport} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Run Reconciliation
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* System Integrity Banner */}
      {report && (
        <Card
          className={`p-5 border ${
            report.is_fully_reconciled
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {report.is_fully_reconciled ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-700 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-700 flex-shrink-0" />
            )}
            <div>
              <h2
                className={`text-base font-bold ${
                  report.is_fully_reconciled ? "text-emerald-950" : "text-amber-950"
                }`}
              >
                {report.is_fully_reconciled
                  ? "General Ledger Fully Reconciled with All Subledgers"
                  : "Discrepancies Detected Across Subledgers"}
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  report.is_fully_reconciled ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                Generated at: {new Date(report.generated_at).toLocaleString()} • Scope: Accounts Receivable, Accounts Payable, Treasury & Cashbooks, and Inventory.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Subledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderModuleCard("Accounts Receivable (AR)", report?.summary?.ar)}
        {renderModuleCard("Accounts Payable (AP)", report?.summary?.ap)}
        {renderModuleCard("Treasury & Cashbooks", report?.summary?.treasury)}
        {renderModuleCard("Inventory Stock Valuation", report?.summary?.inventory)}
      </div>

      {/* Detailed Treasury Account Breakdown */}
      {report?.summary?.treasury?.items && report.summary.treasury.items.length > 0 && (
        <Card className="overflow-hidden border border-neutral-200">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900">Treasury Financial Account Itemization</h3>
            <p className="text-xs text-neutral-500">Individual bank accounts, cash drawers, and mapped control accounts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 text-neutral-600 uppercase font-medium">
                <tr>
                  <th className="p-3">Financial Account</th>
                  <th className="p-3">Mapped GL Account</th>
                  <th className="p-3 text-right">Operational Balance (৳)</th>
                  <th className="p-3 text-right">General Ledger Balance (৳)</th>
                  <th className="p-3 text-right">Difference (৳)</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {report.summary.treasury.items.map((it) => (
                  <tr key={it.financial_account_id} className="hover:bg-neutral-50/80">
                    <td className="p-3 font-sans">
                      <div className="font-medium text-neutral-900">{it.financial_account_name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">[{it.financial_account_code}]</div>
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-medium text-neutral-900">{it.accounting_account_name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">[{it.accounting_account_code}]</div>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {Number(it.operational_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {Number(it.gl_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        it.difference === "0.00" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {Number(it.difference).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-sans">
                      {it.is_reconciled ? (
                        <Badge variant="success">Match</Badge>
                      ) : (
                        <Badge variant="danger">Discrepancy</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

