"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountStatementMappingItem, StatementLineItem, MappingStatus, StatementType } from "@/types/reporting";
import { Account } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Network,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  CheckSquare,
  ShieldAlert,
  ArrowRight,
  Filter,
  Wand2,
} from "lucide-react";

export default function StatementMappingsPage() {
  const [mappings, setMappings] = useState<AccountStatementMappingItem[]>([]);
  const [statementLines, setStatementLines] = useState<StatementLineItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stmtTypeFilter, setStmtTypeFilter] = useState<string>("");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAccountId, setNewAccountId] = useState<string>("");
  const [newLineId, setNewLineId] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  // Reject Modal
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mList, linesList, accRes] = await Promise.all([
        adminApi.getAccountStatementMappings({
          status: statusFilter ? (statusFilter as MappingStatus) : undefined,
          statement_type: stmtTypeFilter ? (stmtTypeFilter as StatementType) : undefined,
        }),
        adminApi.getStatementLines(),
        adminApi.getChartOfAccounts(),
      ]);
      setMappings(mList);
      setStatementLines(linesList);
      const accs = Array.isArray(accRes) ? accRes : (accRes as any)?.results || [];
      setAccounts(accs);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load account statement mappings.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, stmtTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountId || !newLineId) {
      alert("Please select both an account and a statement line.");
      return;
    }
    try {
      await adminApi.createAccountStatementMapping({
        account_id: Number(newAccountId),
        statement_line_id: Number(newLineId),
        notes: newNotes,
      });
      setShowCreateModal(false);
      setNewAccountId("");
      setNewLineId("");
      setNewNotes("");
      setActionSuccess("Draft mapping created successfully.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create mapping.");
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await adminApi.submitStatementMapping(id);
      setActionSuccess("Mapping submitted for independent review.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to submit mapping.");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await adminApi.approveStatementMapping(id);
      setActionSuccess("Mapping successfully approved by checker.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Approval failed. Remember: Maker-checker rules strictly prohibit creator self-approval.");
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      await adminApi.rejectStatementMapping(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      setActionSuccess("Mapping rejected and returned to draft.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to reject mapping.");
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await adminApi.activateStatementMapping(id);
      setActionSuccess("Mapping activated into authoritative statement calculations.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to activate mapping.");
    }
  };

  const handleRetire = async (id: number) => {
    if (!confirm("Are you sure you want to retire this mapping version?")) return;
    try {
      await adminApi.retireStatementMapping(id);
      setActionSuccess("Mapping retired.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to retire mapping.");
    }
  };

  const handleAutoMap = async () => {
    if (!confirm("Auto-map standard Chart of Accounts to default statement lines?")) return;
    try {
      const res = await adminApi.autoMapChartOfAccounts();
      setActionSuccess(`Auto-mapped: ${res.created} created, ${res.activated} activated.`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to run auto-mapping.");
    }
  };

  const getStatusBadge = (status: MappingStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Active</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Approved</Badge>;
      case "submitted":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Submitted (Queue)</Badge>;
      case "draft":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300">Draft</Badge>;
      case "retired":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Retired</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Statement Line Mappings
          </h1>
          <p className="text-sm text-slate-500">
            Governed account-to-statement-line mapping with strict maker-checker segregation of duties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleAutoMap}>
            <Wand2 className="h-4 w-4 mr-1.5 text-blue-600" />
            Auto-Map Standard COA
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Mapping
          </Button>
        </div>
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

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active (Authoritative)</option>
              <option value="submitted">Submitted (Awaiting Checker Review)</option>
              <option value="approved">Approved (Ready to Activate)</option>
              <option value="draft">Draft</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Filter by Statement Type
            </label>
            <select
              value={stmtTypeFilter}
              onChange={(e) => setStmtTypeFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statements</option>
              <option value="profit_and_loss">Profit & Loss Statement</option>
              <option value="balance_sheet">Classified Balance Sheet</option>
              <option value="cash_flow">Statement of Cash Flows</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Mappings Table */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Account Code & Name</th>
                <th className="px-6 py-3">Statement Line</th>
                <th className="px-6 py-3">Statement</th>
                <th className="px-6 py-3">Version</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Maker / Checker</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {mappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-mono font-bold text-slate-800">{m.account_code}</div>
                    <div className="text-xs text-slate-500">{m.account_name}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-slate-900">{m.statement_line_name}</div>
                    <div className="font-mono text-xs text-slate-400">{m.statement_line_code}</div>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 capitalize">
                    {m.statement_type.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs">v{m.version}</td>
                  <td className="px-6 py-3.5">{getStatusBadge(m.status)}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">
                    <div>Maker: {m.created_by_email || "System"}</div>
                    {m.approved_by_email && <div>Checker: {m.approved_by_email}</div>}
                    {m.rejection_reason && (
                      <div className="text-red-600 font-medium mt-0.5">Reason: {m.rejection_reason}</div>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {m.status === "draft" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSubmit(m.id)}
                          className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          Submit
                        </Button>
                      )}

                      {m.status === "submitted" && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleApprove(m.id)}
                            className="h-7 text-xs text-blue-700 border-blue-300 hover:bg-blue-50"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setRejectingId(m.id)}
                            className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {m.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(m.id)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Activate
                        </Button>
                      )}

                      {m.status === "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetire(m.id)}
                          className="h-7 text-xs text-slate-500 hover:text-red-700"
                        >
                          Retire
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateMapping} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Create Draft Account Statement Mapping
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                General Ledger Account
              </label>
              <select
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Account</option>
                {accounts.filter((a) => a.allow_posting).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name} ({a.account_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Financial Statement Line
              </label>
              <select
                value={newLineId}
                onChange={(e) => setNewLineId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Statement Line</option>
                {statementLines.filter((l) => l.calculation_method === "account_sum").map((l) => (
                  <option key={l.line_id || l.id} value={l.line_id || l.id}>
                    [{l.statement_type?.toUpperCase() || "LINE"}] {l.code} — {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Governance Notes / Justification
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
                placeholder="Audit notes or classification justification..."
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Draft Mapping
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleReject} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Reject Statement Mapping
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rejection Reason (Required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain reason for rejection..."
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" size="sm" onClick={() => setRejectingId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm">
                Confirm Rejection
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
