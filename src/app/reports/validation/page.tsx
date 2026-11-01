"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { FinancialValidationResponse, ValidationIssue } from "@/types/reporting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  ClipboardCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";

export default function ReportingValidationPage() {
  const [data, setData] = useState<FinancialValidationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.validateFinancialReporting();
      setData(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to run financial reporting validation engine.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSeverityBadge = (severity: ValidationIssue["severity"]) => {
    switch (severity) {
      case "blocking":
        return <Badge variant="danger">Blocking</Badge>;
      case "high":
        return <Badge className="bg-red-100 text-red-800 border-red-300">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Low / Advisory</Badge>;
      default:
        return <Badge variant="muted">{severity}</Badge>;
    }
  };

  const getStatusBanner = () => {
    if (!data) return null;
    switch (data.overall_status) {
      case "complete":
        return (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 shadow-sm flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-900">Financial Reporting Ready: Complete</span>
              <p className="text-xs text-emerald-800">
                All accounting prerequisites, trial balance equilibrium, and statement mappings are verified.
              </p>
            </div>
          </div>
        );
      case "provisional":
        return (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-900">Financial Statements Provisional</span>
              <p className="text-xs text-amber-800">
                Statements can be generated, but carry provisional status due to unapproved currency or minor unmapped accounts.
              </p>
            </div>
          </div>
        );
      case "incomplete":
        return (
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 shadow-sm flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 shrink-0" />
            <div>
              <span className="font-bold text-orange-900">Reporting Prerequisites Incomplete</span>
              <p className="text-xs text-orange-800">
                Critical statement prerequisites or trial balance discrepancies require accountant attention before final statement issue.
              </p>
            </div>
          </div>
        );
      case "blocked":
        return (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 shadow-sm flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-red-900">Financial Reporting Blocked</span>
              <p className="text-xs text-red-800">
                Double-entry balancing violations or corrupted data prevent reliable statement generation.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reporting Validation & Audit Diagnostics
          </h1>
          <p className="text-sm text-slate-500">
            Automated pre-flight validation checking currency approval, period validity, trial balance equilibrium, and mapping completeness.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Re-Run Diagnostics
        </Button>
      </div>

      {error && (
        <Alert variant="danger">
          <div className="font-semibold">Diagnostic Failure</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* Overall Status Banner */}
      {getStatusBanner()}

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Currency Approval</span>
            {data?.currency.is_approved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900">
            {data?.currency.code} ({data?.currency.is_approved ? "Approved" : "Unapproved"})
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Decision 14: Base currency governance
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Trial Balance</span>
            {data?.trial_balance_balanced ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900">
            {data?.trial_balance_balanced ? "Debits = Credits" : "Imbalanced"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            General Ledger equilibrium
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Subledger Controls</span>
            {data?.subledger_summary?.ar_reconciled && data?.subledger_summary?.ap_reconciled ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900">
            AR, AP, Bank & Stock
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Control account reconciliation
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase">
            <span>Diagnosed Issues</span>
            <span className="font-mono text-xs font-bold text-slate-700">{data?.issues_count || 0}</span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900">
            {data?.issues_count === 0 ? "Zero Issues" : `${data?.issues_count} Action Items`}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Pre-flight audit items
          </div>
        </Card>
      </div>

      {/* Detailed Issues List */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">
            Audit Pre-Flight Diagnostic Items
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {data?.issues.length || 0} Findings
          </span>
        </div>

        {data?.issues.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            No validation issues found. All financial statement prerequisites are satisfied.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.issues.map((issue: ValidationIssue, idx: number) => (
              <div key={idx} className="p-5 hover:bg-slate-50/60 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{issue.code}</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">[{issue.category}]</span>
                  </div>
                  {getSeverityBadge(issue.severity)}
                </div>

                <p className="text-sm font-semibold text-slate-900">{issue.message}</p>

                {issue.action_required && (
                  <div className="rounded bg-slate-100 p-2.5 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Action Required: </span>
                    {issue.action_required}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
