"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  GatewaySettlementBatch,
  GatewaySettlementLine,
  FinancialAccount,
} from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Layers,
  FileSpreadsheet,
  Building,
  ArrowRight,
  Search,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Eye,
} from "lucide-react";

export default function GatewaySettlementsPage() {
  const [batches, setBatches] = useState<GatewaySettlementBatch[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Batch for Details & Line Items
  const [selectedBatch, setSelectedBatch] = useState<GatewaySettlementBatch | null>(null);
  const [lines, setLines] = useState<GatewaySettlementLine[]>([]);
  const [loadingLines, setLoadingLines] = useState<boolean>(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importData, setImportData] = useState({
    clearing_account_id: "",
    destination_bank_id: "",
    settlement_date: new Date().toISOString().split("T")[0],
    external_batch_ref: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reversal Confirmation Modal
  const [reverseModalBatch, setReverseModalBatch] = useState<GatewaySettlementBatch | null>(null);
  const [reverseReason, setReverseReason] = useState<string>("");
  const [reversing, setReversing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchRes, accRes] = await Promise.all([
        adminApi.getGatewaySettlementBatches(),
        adminApi.getFinancialAccounts({ is_active: true }),
      ]);
      setBatches(batchRes);
      setAccounts(accRes);

      const clearingAcc = accRes.find((a) => a.account_type === "clearing");
      const bankAcc = accRes.find((a) => a.account_type === "bank");
      setImportData((prev) => ({
        ...prev,
        clearing_account_id: prev.clearing_account_id || (clearingAcc ? String(clearingAcc.id) : ""),
        destination_bank_id: prev.destination_bank_id || (bankAcc ? String(bankAcc.id) : ""),
      }));
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load gateway settlement batches.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectBatch = async (batch: GatewaySettlementBatch) => {
    setSelectedBatch(batch);
    try {
      setLoadingLines(true);
      const lineItems = await adminApi.getGatewaySettlementLines(batch.id);
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
      setError("Please select an SSLCOMMERZ CSV settlement file to upload.");
      return;
    }
    if (!importData.clearing_account_id || !importData.destination_bank_id) {
      setError("Please select both a clearing account and destination bank account.");
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("clearing_account", importData.clearing_account_id);
      formData.append("destination_bank_account", importData.destination_bank_id);
      formData.append("settlement_date", importData.settlement_date);
      if (importData.external_batch_ref) {
        formData.append("external_batch_ref", importData.external_batch_ref);
      }

      const newBatch = await adminApi.importGatewaySettlement(formData);
      setSuccessMsg(`Settlement batch ${newBatch.batch_number} imported successfully with ${newBatch.lines_count} lines.`);
      setShowImportModal(false);
      setSelectedFile(null);
      await loadData();
      handleSelectBatch(newBatch);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to import settlement statement.");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmBatch = async (batch: GatewaySettlementBatch) => {
    try {
      setLoading(true);
      setError(null);
      await adminApi.confirmGatewaySettlement(batch.id);
      setSuccessMsg(`Batch ${batch.batch_number} confirmed. Net payout transferred to destination bank.`);
      await loadData();
      if (selectedBatch && selectedBatch.id === batch.id) {
        const updated = await adminApi.getGatewaySettlement(batch.id);
        setSelectedBatch(updated);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to confirm settlement batch.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReverseBatch = async () => {
    if (!reverseModalBatch) return;
    if (!reverseReason.trim()) {
      setError("Reversal reason is required.");
      return;
    }

    try {
      setReversing(true);
      setError(null);
      await adminApi.reverseGatewaySettlement(reverseModalBatch.id, reverseReason);
      setSuccessMsg(`Batch ${reverseModalBatch.batch_number} reversed with contra-entries.`);
      setReverseModalBatch(null);
      setReverseReason("");
      await loadData();
      if (selectedBatch && selectedBatch.id === reverseModalBatch.id) {
        const updated = await adminApi.getGatewaySettlement(reverseModalBatch.id);
        setSelectedBatch(updated);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reverse settlement batch.");
      }
    } finally {
      setReversing(false);
    }
  };

  const getStatusBadge = (status: GatewaySettlementBatch["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="warning">Draft (Pending Review)</Badge>;
      case "confirmed":
        return <Badge variant="success">Confirmed & Settled</Badge>;
      case "cancelled":
        return <Badge variant="muted">Cancelled</Badge>;
      case "reversed":
        return <Badge variant="danger">Reversed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const getMatchStatusBadge = (status: GatewaySettlementLine["match_status"]) => {
    switch (status) {
      case "matched":
        return <Badge variant="success">Matched</Badge>;
      case "manually_matched":
        return <Badge variant="primary">Manually Matched</Badge>;
      case "unmatched":
        return <Badge variant="warning">Unmatched</Badge>;
      case "disputed":
        return <Badge variant="danger">Disputed</Badge>;
      case "duplicate":
        return <Badge variant="danger">Duplicate</Badge>;
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
            <UploadCloud className="h-6 w-6 text-primary" />
            SSLCOMMERZ Gateway Settlement Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import gateway payout CSVs, match transaction IDs against customer payments, isolate MDR fees, and settle funds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowImportModal(true)}>
            <UploadCloud className="h-4 w-4 mr-2" />
            Import CSV Batch
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

      {/* Batches List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Settlement Statement Batches
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Batch #</th>
                <th className="py-3 px-4">Settlement Date</th>
                <th className="py-3 px-4">Clearing Account</th>
                <th className="py-3 px-4">Destination Bank</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4 text-right">MDR Fees</th>
                <th className="py-3 px-4 text-right">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No gateway settlement batches imported yet. Click &quot;Import CSV Batch&quot; to begin.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                      selectedBatch?.id === batch.id ? "bg-primary/5 font-medium" : ""
                    }`}
                    onClick={() => handleSelectBatch(batch)}
                  >
                    <td className="py-3 px-4 font-mono text-primary font-semibold">
                      {batch.batch_number}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {batch.settlement_date}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{batch.clearing_account_code}</td>
                    <td className="py-3 px-4 font-mono text-xs">{batch.destination_bank_code}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      ৳{parseFloat(batch.gross_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-500">
                      -৳{parseFloat(batch.fee_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ৳{parseFloat(batch.net_payout).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(batch.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary"
                          onClick={() => handleSelectBatch(batch)}
                          title="Inspect Lines"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {batch.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleConfirmBatch(batch)}
                            title="Confirm & Transfer Funds"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {batch.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setReverseModalBatch(batch)}
                            title="Reverse Settlement"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reverse
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

      {/* Selected Batch Details & Line Inspector */}
      {selectedBatch && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Batch: {selectedBatch.batch_number}
                </h2>
                {getStatusBadge(selectedBatch.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Imported by {selectedBatch.imported_by_username || "System"} on{" "}
                {new Date(selectedBatch.created_at).toLocaleString()} | File Hash:{" "}
                <span className="font-mono">{selectedBatch.file_hash.substring(0, 12)}...</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedBatch.status === "draft" && (
                <Button size="sm" onClick={() => handleConfirmBatch(selectedBatch)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm & Post Settlement
                </Button>
              )}
              {selectedBatch.status === "confirmed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  onClick={() => setReverseModalBatch(selectedBatch)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reverse Settlement
                </Button>
              )}
            </div>
          </div>

          {/* Batch Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Gross Amount</span>
              <p className="text-base font-bold font-mono text-foreground">
                ৳{parseFloat(selectedBatch.gross_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">MDR Gateway Fee</span>
              <p className="text-base font-bold font-mono text-rose-500">
                -৳{parseFloat(selectedBatch.fee_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Net Payout Transferred</span>
              <p className="text-base font-bold font-mono text-emerald-600">
                ৳{parseFloat(selectedBatch.net_payout).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Statement Lines</span>
              <p className="text-base font-bold font-mono text-foreground">
                {selectedBatch.lines_count} Lines
              </p>
            </div>
          </div>

          {/* Lines Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Statement Reconciliation Lines ({lines.length})
            </h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">Gateway Tran ID</th>
                    <th className="py-2.5 px-3">Bank Tran ID</th>
                    <th className="py-2.5 px-3 text-right">Gross</th>
                    <th className="py-2.5 px-3 text-right">Fee</th>
                    <th className="py-2.5 px-3 text-right">Net</th>
                    <th className="py-2.5 px-3">Match Status</th>
                    <th className="py-2.5 px-3">Matched Payment Ref</th>
                    <th className="py-2.5 px-3">Notes / Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {loadingLines ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-muted-foreground font-sans">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-primary" />
                        Loading statement line items...
                      </td>
                    </tr>
                  ) : lines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-muted-foreground font-sans">
                        No lines found for this batch.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <tr key={line.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {line.external_tran_id || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {line.bank_tran_id || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          ৳{parseFloat(line.gross_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-500">
                          -৳{parseFloat(line.fee_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                          ৳{parseFloat(line.net_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {getMatchStatusBadge(line.match_status)}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {line.matched_payment_public_id ? (
                            <span className="text-primary font-medium">
                              Pay #{line.matched_payment_public_id.substring(0, 8)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-xs text-muted-foreground">
                          {line.discrepancy_reason || "None"}
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
              Import SSLCOMMERZ Settlement CSV
            </h2>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Clearing Account (Source) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={importData.clearing_account_id}
                  onChange={(e) =>
                    setImportData({ ...importData, clearing_account_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select clearing account...</option>
                  {accounts
                    .filter((a) => a.account_type === "clearing")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Destination Bank Account (Payout) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={importData.destination_bank_id}
                  onChange={(e) =>
                    setImportData({ ...importData, destination_bank_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select destination bank...</option>
                  {accounts
                    .filter((a) => a.account_type === "bank")
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code}) — {acc.bank_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Settlement Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importData.settlement_date}
                    onChange={(e) =>
                      setImportData({ ...importData, settlement_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Batch Reference / Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SSL-SETTLE-20261031"
                    value={importData.external_batch_ref}
                    onChange={(e) =>
                      setImportData({ ...importData, external_batch_ref: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Statement File (.CSV) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supports standard SSLCOMMERZ Merchant settlement statements with transaction ID, gross, fee, and net columns.
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
                      Uploading & Parsing...
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

      {/* Reversal Confirmation Modal */}
      {reverseModalBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Reverse Settlement Batch
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Reversing batch {reverseModalBatch.batch_number} will create contra-transactions reversing the ৳
              {parseFloat(reverseModalBatch.net_payout).toLocaleString()} transfer into{" "}
              {reverseModalBatch.destination_bank_code} and restoring the fee deduction to clearing.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Reversal Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="State the audit reason for this reversal..."
                className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setReverseModalBatch(null);
                  setReverseReason("");
                }}
                disabled={reversing}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReverseBatch} disabled={reversing}>
                {reversing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Reversing...
                  </>
                ) : (
                  "Confirm Reversal"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
