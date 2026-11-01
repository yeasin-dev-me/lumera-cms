"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ReportSnapshotDetail, ReportSnapshotItem, StatementType } from "@/types/reporting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  History,
  RefreshCw,
  Lock,
  Download,
  Eye,
  X,
  FileSpreadsheet,
  Scale,
  Coins,
  CheckCircle2,
} from "lucide-react";

export default function ReportSnapshotsPage() {
  const [snapshots, setSnapshots] = useState<ReportSnapshotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ReportSnapshotDetail | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getReportSnapshots();
      setSnapshots(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load report snapshots.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFinalize = async (id: number) => {
    if (!confirm("Are you sure you want to finalize this snapshot? Once finalized, it becomes completely immutable.")) return;
    try {
      await adminApi.finalizeReportSnapshot(id);
      setActionSuccess("Snapshot successfully finalized and immutably locked.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to finalize snapshot.");
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const snap = await adminApi.getReportSnapshotDetail(id);
      setSelectedSnapshot(snap);
    } catch (err: any) {
      alert(err.message || "Failed to load snapshot details.");
    }
  };

  const getStatementIcon = (type?: StatementType | string) => {
    switch (type) {
      case "profit_and_loss":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      case "balance_sheet":
        return <Scale className="h-4 w-4 text-blue-600" />;
      case "cash_flow":
        return <Coins className="h-4 w-4 text-amber-600" />;
      default:
        return <FileSpreadsheet className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Report Snapshots & Audit Archive
          </h1>
          <p className="text-sm text-slate-500">
            Immutable financial statement snapshots capturing exact historical GL postings and mapping version metadata.
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
          <div className="font-semibold">Error Loading Snapshots</div>
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      {/* Snapshots Table */}
      <Card className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Snapshot # & Title</th>
                <th className="px-6 py-3">Statement Type</th>
                <th className="px-6 py-3">Period / Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created By</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No report snapshots captured yet. You can capture snapshots from the P&L, Balance Sheet, or Cash Flow Cockpits.
                  </td>
                </tr>
              ) : (
                snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {s.snapshot_number}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{s.title}</div>
                      {s.notes && <div className="text-xs text-slate-400">{s.notes}</div>}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 capitalize text-slate-700">
                        {getStatementIcon(s.statement_type)}
                        <span>{s.statement_type?.replace(/_/g, " ") || "Statement"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {s.period_name || s.as_of_date || `${s.start_date} to ${s.end_date}`}
                    </td>
                    <td className="px-6 py-3.5">
                      {s.is_finalized ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1 w-fit">
                          <Lock className="h-3 w-3" /> Finalized
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="text-slate-600">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      <div>{s.created_by_email || "System"}</div>
                      <div>{new Date(s.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(s.id)}
                          className="h-7 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        {!s.is_finalized && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleFinalize(s.id)}
                            className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                          >
                            <Lock className="h-3 w-3 mr-1" /> Finalize
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Snapshot Payload Viewer Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Snapshot #{selectedSnapshot.snapshot_number}: {selectedSnapshot.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Type: {selectedSnapshot.statement_type} | Status: {selectedSnapshot.status} | Captured: {new Date(selectedSnapshot.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSnapshot(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Captured Summary Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(selectedSnapshot.summary_metrics || {}).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block truncate">{k.replace(/_/g, " ")}</span>
                      <span className="font-mono font-bold text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Complete Statement Payload (JSON)
                </h4>
                <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-64">
                  {JSON.stringify(selectedSnapshot.statement_payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-slate-400 font-mono">
                Mapping Snapshot: {selectedSnapshot.mapping_version_snapshot.length} lines archived
              </span>
              <Button size="sm" onClick={() => setSelectedSnapshot(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
