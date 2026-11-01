"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  BankReconciliation,
  BankStatementLine,
  FinancialAccount,
  FinancialAccountTransaction,
} from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Landmark,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Link2,
  Unlink,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function BankReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [bankAccounts, setBankAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Reconciliation Session
  const [selectedRecon, setSelectedRecon] = useState<BankReconciliation | null>(null);
  const [lines, setLines] = useState<BankStatementLine[]>([]);
  const [loadingLines, setLoadingLines] = useState<boolean>(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importData, setImportData] = useState({
    bank_account_id: "",
    statement_start_date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    statement_end_date: new Date().toISOString().split("T")[0],
    opening_balance: "0.00",
    closing_balance: "0.00",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Manual Matching Modal
  const [matchingLine, setMatchingLine] = useState<BankStatementLine | null>(null);
  const [availableTransactions, setAvailableTransactions] = useState<FinancialAccountTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState<boolean>(false);
  const [selectedTxnId, setSelectedTxnId] = useState<string>("");
  const [matchingSubmitting, setMatchingSubmitting] = useState<boolean>(false);

  // Finalize Confirmation
  const [finalizing, setFinalizing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reconRes, accRes] = await Promise.all([
        adminApi.getBankReconciliations(),
        adminApi.getFinancialAccounts({ account_type: "bank", is_active: true }),
      ]);
      setReconciliations(reconRes);
      setBankAccounts(accRes);
      if (accRes.length > 0 && !importData.bank_account_id) {
        setImportData((prev) => ({ ...prev, bank_account_id: String(accRes[0].id) }));
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load bank reconciliations.");
      }
    } finally {
      setLoading(false);
    }
  }, [importData.bank_account_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectRecon = async (recon: BankReconciliation) => {
    setSelectedRecon(recon);
    try {
      setLoadingLines(true);
      const lineItems = await adminApi.getBankReconciliationLines(recon.id);
      setLines(lineItems);
    } catch {
      setLines([]);
    } finally {
      setLoadingLines(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a bank statement CSV file.");
      return;
    }
    if (!importData.bank_account_id) {
      setError("Please select a bank account.");
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("bank_account", importData.bank_account_id);
      formData.append("statement_start_date", importData.statement_start_date);
      formData.append("statement_end_date", importData.statement_end_date);
      formData.append("opening_balance", importData.opening_balance);
      formData.append("closing_balance", importData.closing_balance);

      const newRecon = await adminApi.importBankReconciliation(formData);
      setSuccessMsg(
        `Bank reconciliation session ${newRecon.reconciliation_number} imported successfully with ${newRecon.lines_count} lines.`
      );
      setShowImportModal(false);
      setSelectedFile(null);
      await loadData();
      handleSelectRecon(newRecon);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to import bank statement.");
      }
    } finally {
      setImporting(false);
    }
  };

  const openManualMatchModal = async (line: BankStatementLine) => {
    setMatchingLine(line);
    setSelectedTxnId("");
    if (!selectedRecon) return;

    try {
      setLoadingTxns(true);
      // Fetch account transactions for this bank account
      const txns = await adminApi.getAccountTransactions(selectedRecon.bank_account);
      setAvailableTransactions(txns);
    } catch {
      setAvailableTransactions([]);
    } finally {
      setLoadingTxns(false);
    }
  };

  const handleConfirmManualMatch = async () => {
    if (!matchingLine || !selectedTxnId) return;
    try {
      setMatchingSubmitting(true);
      setError(null);
      await adminApi.matchBankStatementLine(matchingLine.id, selectedTxnId);
      setSuccessMsg("Statement line matched manually with treasury transaction.");
      setMatchingLine(null);
      if (selectedRecon) {
        const updatedLines = await adminApi.getBankReconciliationLines(selectedRecon.id);
        setLines(updatedLines);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to match statement line.");
      }
    } finally {
      setMatchingSubmitting(false);
    }
  };

  const handleUnmatchLine = async (lineId: number) => {
    try {
      setLoading(true);
      setError(null);
      await adminApi.unmatchBankStatementLine(lineId);
      setSuccessMsg("Statement line unmatched successfully.");
      if (selectedRecon) {
        const updatedLines = await adminApi.getBankReconciliationLines(selectedRecon.id);
        setLines(updatedLines);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to unmatch line.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeReconciliation = async () => {
    if (!selectedRecon) return;
    try {
      setFinalizing(true);
      setError(null);
      const finalized = await adminApi.finalizeBankReconciliation(selectedRecon.id);
      setSuccessMsg(`Reconciliation ${finalized.reconciliation_number} finalized.`);
      await loadData();
      setSelectedRecon(finalized);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to finalize reconciliation session.");
      }
    } finally {
      setFinalizing(false);
    }
  };

  const getStatusBadge = (status: BankReconciliation["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="warning">Draft</Badge>;
      case "in_progress":
        return <Badge variant="primary">In Progress</Badge>;
      case "finalized":
        return <Badge variant="success">Finalized</Badge>;
      case "cancelled":
        return <Badge variant="muted">Cancelled</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const getLineMatchBadge = (status: BankStatementLine["match_status"]) => {
    switch (status) {
      case "matched":
        return <Badge variant="success">Auto Matched</Badge>;
      case "manually_matched":
        return <Badge variant="primary">Manual Matched</Badge>;
      case "unmatched":
        return <Badge variant="warning">Unmatched</Badge>;
      case "disputed":
        return <Badge variant="danger">Disputed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            Bank Statement Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconcile external commercial bank statements against internal Treasury subledger transactions with automated and manual matching.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowImportModal(true)}>
            <UploadCloud className="h-4 w-4 mr-2" />
            Import Bank Statement
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success">
          {successMsg}
        </Alert>
      )}

      {/* Reconciliation Sessions List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Bank Reconciliation Sessions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Session #</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Closing Balance</th>
                <th className="py-3 px-4 text-center">Lines</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading reconciliation sessions...
                  </td>
                </tr>
              ) : reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No bank reconciliation sessions found. Click &quot;Import Bank Statement&quot; to start one.
                  </td>
                </tr>
              ) : (
                reconciliations.map((recon) => (
                  <tr
                    key={recon.id}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                      selectedRecon?.id === recon.id ? "bg-primary/5 font-medium" : ""
                    }`}
                    onClick={() => handleSelectRecon(recon)}
                  >
                    <td className="py-3 px-4 font-mono text-primary font-semibold">
                      {recon.reconciliation_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {recon.bank_account_name} ({recon.bank_account_code})
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                      {recon.statement_start_date} to {recon.statement_end_date}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ৳{parseFloat(recon.opening_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      ৳{parseFloat(recon.closing_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{recon.lines_count}</td>
                    <td className="py-3 px-4">{getStatusBadge(recon.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRecon(recon);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Reconciliation Details & Statement Line Grid */}
      {selectedRecon && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Session: {selectedRecon.reconciliation_number} — {selectedRecon.bank_account_name}
                </h2>
                {getStatusBadge(selectedRecon.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Statement Window: {selectedRecon.statement_start_date} to {selectedRecon.statement_end_date} |{" "}
                Imported by {selectedRecon.imported_by_username || "System"} on{" "}
                {new Date(selectedRecon.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedRecon.status !== "finalized" && (
                <Button size="sm" onClick={handleFinalizeReconciliation} disabled={finalizing}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {finalizing ? "Finalizing..." : "Finalize Reconciliation"}
                </Button>
              )}
            </div>
          </div>

          {/* Reconciliation Balance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Statement Opening</span>
              <p className="text-base font-bold font-mono text-foreground">
                ৳{parseFloat(selectedRecon.opening_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Statement Closing</span>
              <p className="text-base font-bold font-mono text-foreground">
                ৳{parseFloat(selectedRecon.closing_balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Total Lines</span>
              <p className="text-base font-bold font-mono text-foreground">
                {selectedRecon.lines_count} Lines
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Matched Rate</span>
              <p className="text-base font-bold font-mono text-emerald-600">
                {lines.length > 0
                  ? `${Math.round(
                      (lines.filter((l) => l.match_status === "matched" || l.match_status === "manually_matched")
                        .length /
                        lines.length) *
                        100
                    )}%`
                  : "0%"}
              </p>
            </div>
          </div>

          {/* Statement Lines Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Statement Lines & Matching Grid ({lines.length})
            </h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3 text-right">Debit (Out)</th>
                    <th className="py-2.5 px-3 text-right">Credit (In)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Matched Txn</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {loadingLines ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground font-sans">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-primary" />
                        Loading statement lines...
                      </td>
                    </tr>
                  ) : lines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground font-sans">
                        No lines found in statement.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <tr key={line.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                          {line.transaction_date}
                        </td>
                        <td className="py-2.5 px-3 font-sans max-w-[200px] truncate" title={line.description}>
                          {line.description}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{line.reference || "—"}</td>
                        <td className="py-2.5 px-3 text-right text-rose-500">
                          {parseFloat(line.debit_amount) > 0
                            ? `-৳${parseFloat(line.debit_amount).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600">
                          {parseFloat(line.credit_amount) > 0
                            ? `+৳${parseFloat(line.credit_amount).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-foreground">
                          {line.running_balance ? `৳${parseFloat(line.running_balance).toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-sans">{getLineMatchBadge(line.match_status)}</td>
                        <td className="py-2.5 px-3 text-primary font-medium">
                          {line.matched_transaction_number || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          {selectedRecon.status !== "finalized" && (
                            <>
                              {line.match_status === "unmatched" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-primary"
                                  onClick={() => openManualMatchModal(line)}
                                  title="Manually match with a Treasury transaction"
                                >
                                  <Link2 className="h-3.5 w-3.5 mr-1" />
                                  Match
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600"
                                  onClick={() => handleUnmatchLine(line.id)}
                                  title="Unmatch line"
                                >
                                  <Unlink className="h-3.5 w-3.5 mr-1" />
                                  Unmatch
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Import Commercial Bank Statement (.CSV)
            </h2>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Bank Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={importData.bank_account_id}
                  onChange={(e) =>
                    setImportData({ ...importData, bank_account_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) — {acc.bank_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importData.statement_start_date}
                    onChange={(e) =>
                      setImportData({ ...importData, statement_start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importData.statement_end_date}
                    onChange={(e) =>
                      setImportData({ ...importData, statement_end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Opening Balance (BDT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={importData.opening_balance}
                    onChange={(e) =>
                      setImportData({ ...importData, opening_balance: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Closing Balance (BDT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={importData.closing_balance}
                    onChange={(e) =>
                      setImportData({ ...importData, closing_balance: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Bank Statement File (.CSV) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  CSV must include transaction date, description, debit, and credit columns.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={importing}>
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Parsing Statement...
                    </>
                  ) : (
                    "Import Statement"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Manual Matching Dialog */}
      {matchingLine && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Manual Match Statement Line
            </h2>

            <div className="bg-muted/30 p-3 rounded-lg border mb-4 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="font-medium text-foreground">{matchingLine.transaction_date}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Description: </span>
                <span className="font-medium text-foreground">{matchingLine.description}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Amount: </span>
                <span className="font-mono font-bold text-foreground">
                  {parseFloat(matchingLine.debit_amount) > 0
                    ? `Debit: ৳${parseFloat(matchingLine.debit_amount).toFixed(2)}`
                    : `Credit: ৳${parseFloat(matchingLine.credit_amount).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-medium text-muted-foreground">
                Select Matching Treasury Subledger Transaction:
              </label>
              {loadingTxns ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-primary" />
                  Loading transactions...
                </div>
              ) : availableTransactions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent transactions found on this account.</p>
              ) : (
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                >
                  <option value="">Select transaction...</option>
                  {availableTransactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.transaction_number} | {t.transaction_date} | {t.direction.toUpperCase()} ৳
                      {parseFloat(t.amount).toFixed(2)} | {t.description.substring(0, 30)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setMatchingLine(null)}
                disabled={matchingSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmManualMatch}
                disabled={matchingSubmitting || !selectedTxnId}
              >
                {matchingSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  "Confirm Match"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
