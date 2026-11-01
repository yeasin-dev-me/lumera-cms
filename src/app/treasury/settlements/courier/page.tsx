"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import {
  CourierRemittanceSheet,
  CourierRemittanceLine,
  FinancialAccount,
} from "@/types/treasury";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Truck,
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
  PackageCheck,
  AlertOctagon,
} from "lucide-react";

export default function CourierSettlementsPage() {
  const [sheets, setSheets] = useState<CourierRemittanceSheet[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Sheet for Details & Line Items
  const [selectedSheet, setSelectedSheet] = useState<CourierRemittanceSheet | null>(null);
  const [lines, setLines] = useState<CourierRemittanceLine[]>([]);
  const [loadingLines, setLoadingLines] = useState<boolean>(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importData, setImportData] = useState({
    courier: "steadfast",
    clearing_account_id: "",
    destination_bank_id: "",
    remittance_date: new Date().toISOString().split("T")[0],
    statement_reference: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reversal Confirmation Modal
  const [reverseModalSheet, setReverseModalSheet] = useState<CourierRemittanceSheet | null>(null);
  const [reverseReason, setReverseReason] = useState<string>("");
  const [reversing, setReversing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sheetRes, accRes] = await Promise.all([
        adminApi.getCourierRemittanceSheets(),
        adminApi.getFinancialAccounts({ is_active: true }),
      ]);
      setSheets(sheetRes);
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
        setError("Failed to load courier remittance sheets.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectSheet = async (sheet: CourierRemittanceSheet) => {
    setSelectedSheet(sheet);
    try {
      setLoadingLines(true);
      const lineItems = await adminApi.getCourierRemittanceLines(sheet.id);
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
      setError("Please select a courier remittance CSV file to upload.");
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
      formData.append("courier", importData.courier);
      formData.append("clearing_account", importData.clearing_account_id);
      formData.append("destination_bank_account", importData.destination_bank_id);
      formData.append("remittance_date", importData.remittance_date);
      if (importData.statement_reference) {
        formData.append("statement_reference", importData.statement_reference);
      }

      const newSheet = await adminApi.importCourierRemittance(formData);
      setSuccessMsg(
        `Remittance sheet ${newSheet.remittance_number} imported successfully with ${newSheet.lines_count} parcels.`
      );
      setShowImportModal(false);
      setSelectedFile(null);
      await loadData();
      handleSelectSheet(newSheet);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to import courier remittance statement.");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmSheet = async (sheet: CourierRemittanceSheet) => {
    try {
      setLoading(true);
      setError(null);
      await adminApi.confirmCourierRemittance(sheet.id);
      setSuccessMsg(`Remittance sheet ${sheet.remittance_number} confirmed. Net COD remitted to bank.`);
      await loadData();
      if (selectedSheet && selectedSheet.id === sheet.id) {
        const updated = await adminApi.getCourierRemittance(sheet.id);
        setSelectedSheet(updated);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to confirm courier remittance.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReverseSheet = async () => {
    if (!reverseModalSheet) return;
    if (!reverseReason.trim()) {
      setError("Reversal reason is required.");
      return;
    }

    try {
      setReversing(true);
      setError(null);
      await adminApi.reverseCourierRemittance(reverseModalSheet.id, reverseReason);
      setSuccessMsg(`Remittance sheet ${reverseModalSheet.remittance_number} reversed with contra-entries.`);
      setReverseModalSheet(null);
      setReverseReason("");
      await loadData();
      if (selectedSheet && selectedSheet.id === reverseModalSheet.id) {
        const updated = await adminApi.getCourierRemittance(reverseModalSheet.id);
        setSelectedSheet(updated);
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to reverse courier remittance.");
      }
    } finally {
      setReversing(false);
    }
  };

  const getStatusBadge = (status: CourierRemittanceSheet["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="warning">Draft (Pending Review)</Badge>;
      case "confirmed":
        return <Badge variant="success">Confirmed & Remitted</Badge>;
      case "cancelled":
        return <Badge variant="muted">Cancelled</Badge>;
      case "reversed":
        return <Badge variant="danger">Reversed</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const getMatchStatusBadge = (status: CourierRemittanceLine["match_status"]) => {
    switch (status) {
      case "matched":
        return <Badge variant="success">Matched</Badge>;
      case "manually_matched":
        return <Badge variant="primary">Manual Match</Badge>;
      case "unmatched":
        return <Badge variant="warning">Unmatched</Badge>;
      case "disputed":
        return <Badge variant="danger">Disputed (Review)</Badge>;
      case "duplicate":
        return <Badge variant="danger">Duplicate</Badge>;
      case "short_paid":
        return <Badge variant="warning">Short Paid</Badge>;
      case "overpaid":
        return <Badge variant="muted">Overpaid</Badge>;
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
            <Truck className="h-6 w-6 text-primary" />
            Courier COD Remittance Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reconcile Steadfast & Pathao COD remittance sheets against e-commerce orders, delivery charges, and Decision 08 lost parcel exceptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowImportModal(true)}>
            <UploadCloud className="h-4 w-4 mr-2" />
            Import Courier CSV
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

      {/* Remittance Sheets Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Remittance Sheets
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Remittance #</th>
                <th className="py-3 px-4">Courier</th>
                <th className="py-3 px-4">Remittance Date</th>
                <th className="py-3 px-4">Destination Bank</th>
                <th className="py-3 px-4 text-right">Collected COD</th>
                <th className="py-3 px-4 text-right">Delivery Charges</th>
                <th className="py-3 px-4 text-right">Net Remitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading courier remittance sheets...
                  </td>
                </tr>
              ) : sheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No courier remittance sheets found. Click &quot;Import Courier CSV&quot; to upload one.
                  </td>
                </tr>
              ) : (
                sheets.map((sheet) => (
                  <tr
                    key={sheet.id}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                      selectedSheet?.id === sheet.id ? "bg-primary/5 font-medium" : ""
                    }`}
                    onClick={() => handleSelectSheet(sheet)}
                  >
                    <td className="py-3 px-4 font-mono text-primary font-semibold">
                      {sheet.remittance_number}
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-foreground">
                      {sheet.courier}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {sheet.remittance_date}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{sheet.destination_bank_code}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      ৳{parseFloat(sheet.total_collected_cod).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-500">
                      -৳{parseFloat(sheet.total_courier_charges).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ৳{parseFloat(sheet.net_remitted_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(sheet.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary"
                          onClick={() => handleSelectSheet(sheet)}
                          title="Inspect Parcels"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {sheet.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleConfirmSheet(sheet)}
                            title="Confirm & Transfer Funds"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {sheet.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setReverseModalSheet(sheet)}
                            title="Reverse Remittance"
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

      {/* Selected Sheet Details & Line Inspector */}
      {selectedSheet && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Sheet: {selectedSheet.remittance_number} ({selectedSheet.courier.toUpperCase()})
                </h2>
                {getStatusBadge(selectedSheet.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Statement Ref: {selectedSheet.statement_reference || "N/A"} | Imported by{" "}
                {selectedSheet.imported_by_username || "System"} on{" "}
                {new Date(selectedSheet.created_at).toLocaleString()} | File Hash:{" "}
                <span className="font-mono">{selectedSheet.file_hash.substring(0, 12)}...</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedSheet.status === "draft" && (
                <Button size="sm" onClick={() => handleConfirmSheet(selectedSheet)}>
                  <PackageCheck className="h-4 w-4 mr-2" />
                  Confirm & Post Remittance
                </Button>
              )}
              {selectedSheet.status === "confirmed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  onClick={() => setReverseModalSheet(selectedSheet)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reverse Remittance
                </Button>
              )}
            </div>
          </div>

          {/* Sheet Financial Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Collected COD</span>
              <p className="text-base font-bold font-mono text-foreground">
                ৳{parseFloat(selectedSheet.total_collected_cod).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Delivery Charges</span>
              <p className="text-base font-bold font-mono text-rose-500">
                -৳{parseFloat(selectedSheet.total_courier_charges).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Other Deductions</span>
              <p className="text-base font-bold font-mono text-amber-500">
                -৳{parseFloat(selectedSheet.other_deductions).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground">Net Bank Payout</span>
              <p className="text-base font-bold font-mono text-emerald-600">
                ৳{parseFloat(selectedSheet.net_remitted_amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Parcel Lines Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Parcel Remittance Lines ({lines.length})
            </h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">Tracking ID</th>
                    <th className="py-2.5 px-3">Order Ref</th>
                    <th className="py-2.5 px-3">System Order</th>
                    <th className="py-2.5 px-3 text-right">Expected COD</th>
                    <th className="py-2.5 px-3 text-right">Collected COD</th>
                    <th className="py-2.5 px-3 text-right">Fee</th>
                    <th className="py-2.5 px-3 text-right">Net</th>
                    <th className="py-2.5 px-3">Match Status</th>
                    <th className="py-2.5 px-3">Exception Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {loadingLines ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground font-sans">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-primary" />
                        Loading parcel lines...
                      </td>
                    </tr>
                  ) : lines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground font-sans">
                        No parcel lines found.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <tr
                        key={line.id}
                        className={`hover:bg-muted/20 ${
                          line.match_status === "disputed" ? "bg-rose-500/5" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {line.tracking_id}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {line.order_reference || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-primary font-medium">
                          {line.matched_order_number || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">
                          ৳{parseFloat(line.expected_cod).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                          ৳{parseFloat(line.collected_cod).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-500">
                          -৳{parseFloat(line.courier_fee).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                          ৳{parseFloat(line.net_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {getMatchStatusBadge(line.match_status)}
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
              Import Courier Remittance CSV
            </h2>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Courier Provider <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={importData.courier}
                  onChange={(e) => setImportData({ ...importData, courier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="steadfast">Steadfast Courier</option>
                  <option value="pathao">Pathao Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Clearing Account (COD Source) <span className="text-rose-500">*</span>
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
                    Remittance Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={importData.remittance_date}
                    onChange={(e) =>
                      setImportData({ ...importData, remittance_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Statement Ref / Invoice #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STF-REMIT-20261031"
                    value={importData.statement_reference}
                    onChange={(e) =>
                      setImportData({ ...importData, statement_reference: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Remittance File (.CSV) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Parses Steadfast (consignment_id, cod_amount, delivery_charge) or Pathao (tracking_code, collected_amount).
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
                      Parsing Remittance...
                    </>
                  ) : (
                    "Import Remittance"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reverseModalSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Reverse Courier Remittance
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Reversing sheet {reverseModalSheet.remittance_number} will create contra-transactions reversing the ৳
              {parseFloat(reverseModalSheet.net_remitted_amount).toLocaleString()} payout transfer and restoring deductions.
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
                  setReverseModalSheet(null);
                  setReverseReason("");
                }}
                disabled={reversing}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReverseSheet} disabled={reversing}>
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
