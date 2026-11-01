"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { SalesReturn, ReturnCondition, InspectReturnInput } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  PackageCheck,
  Ban,
  ShieldAlert,
} from "lucide-react";

export default function SalesReturnDetailPage() {
  const params = useParams();
  const returnId = params.id as string;

  const [salesReturn, setSalesReturn] = useState<SalesReturn | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inspection form state
  const [inspections, setInspections] = useState<
    {
      itemId: number;
      productName: string;
      sku: string;
      returnQty: number;
      acceptedQty: number;
      rejectedQty: number;
      condition: ReturnCondition;
      notes: string;
    }[]
  >([]);

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadReturn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSalesReturn(returnId);
      setSalesReturn(data);
      setInspections(
        (data.items || []).map((it) => ({
          itemId: it.id,
          productName: it.product_name,
          sku: it.product_sku,
          returnQty: it.return_quantity,
          acceptedQty: it.accepted_quantity || it.return_quantity,
          rejectedQty: it.rejected_quantity || 0,
          condition: it.condition || "resellable",
          notes: it.notes || "",
        }))
      );
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load return details.");
      }
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  const handleSaveInspection = async () => {
    if (!salesReturn) return;
    setActionLoading(true);
    setError(null);

    try {
      const payload: InspectReturnInput = {
        inspections: inspections.map((ins) => ({
          item_id: ins.itemId,
          accepted_quantity: ins.acceptedQty,
          rejected_quantity: ins.rejectedQty,
          condition: ins.condition,
          notes: ins.notes,
        })),
      };

      const updated = await adminApi.inspectSalesReturn(salesReturn.id, payload);
      setSalesReturn(updated);
      setSuccessMsg("Dock inspection results saved successfully.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to save inspection.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteReturn = async () => {
    if (!salesReturn) return;
    setActionLoading(true);
    setError(null);

    try {
      const updated = await adminApi.completeSalesReturn(salesReturn.id);
      setSalesReturn(updated);
      setSuccessMsg("Sales return completed. Resellable items restocked into inventory.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to complete return.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!salesReturn) return;
    setActionLoading(true);
    setError(null);

    try {
      const updated = await adminApi.cancelSalesReturn(salesReturn.id);
      setSalesReturn(updated);
      setSuccessMsg("Sales return cancelled.");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel return.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-600" />
        Loading return details...
      </div>
    );
  }

  if (!salesReturn) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Return record not found.</p>
        <Link href="/sales/returns">
          <Button variant="secondary">Back to Returns</Button>
        </Link>
      </div>
    );
  }

  const isEditable = salesReturn.status === "draft" || salesReturn.status === "received";
  const canComplete = salesReturn.status === "inspected";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sales/returns">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {salesReturn.return_number}
              </h1>
              {salesReturn.status === "completed" ? (
                <Badge variant="success">Completed</Badge>
              ) : salesReturn.status === "inspected" ? (
                <Badge variant="accent">Inspected</Badge>
              ) : salesReturn.status === "draft" ? (
                <Badge variant="warning">Draft</Badge>
              ) : (
                <Badge variant="muted">{salesReturn.status}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Invoice: <span className="font-mono text-gray-900">{salesReturn.invoice_number}</span> •
              Reason: {salesReturn.reason.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditable && (
            <Button
              size="sm"
              onClick={handleSaveInspection}
              disabled={actionLoading}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <PackageCheck className="h-4 w-4 mr-1.5" />
              Save Inspection
            </Button>
          )}

          {canComplete && (
            <Button
              size="sm"
              onClick={handleCompleteReturn}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Complete & Restock Resellable
            </Button>
          )}

          {salesReturn.status !== "completed" && salesReturn.status !== "cancelled" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelReturn}
              disabled={actionLoading}
              className="text-red-600 hover:bg-red-50"
            >
              <Ban className="h-4 w-4 mr-1" />
              Cancel Return
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Workflow Guidance Card */}
      <Card className="p-4 bg-blue-50/50 border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">Inventory Restocking Guardrails</strong>
          <p className="text-blue-800 mt-0.5">
            Only items inspected as <strong>Resellable</strong> will be added back to saleable inventory stock.
            Damaged, opened, or expired goods are quarantined and will never increment saleable stock.
          </p>
        </div>
      </Card>

      {/* Inspection Items Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm">
            Dock Quality Inspection ({inspections.length} lines)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Product Line</th>
                <th className="py-3 px-4 text-center">Returned</th>
                <th className="py-3 px-4 text-center">Accepted</th>
                <th className="py-3 px-4 text-center">Rejected</th>
                <th className="py-3 px-4">Inspection Condition</th>
                <th className="py-3 px-4">Notes / Defect Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {inspections.map((ins, idx) => (
                <tr key={ins.itemId} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 block">{ins.productName}</span>
                    <span className="font-mono text-xs text-gray-400">{ins.sku}</span>
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-gray-900">
                    {ins.returnQty}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        max={ins.returnQty}
                        value={ins.acceptedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value || "0");
                          setInspections((prev) =>
                            prev.map((it, i) =>
                              i === idx
                                ? { ...it, acceptedQty: val, rejectedQty: it.returnQty - val }
                                : it
                            )
                          );
                        }}
                        className="w-16 px-2 py-1 border rounded text-center text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-emerald-600">{ins.acceptedQty}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        max={ins.returnQty}
                        value={ins.rejectedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value || "0");
                          setInspections((prev) =>
                            prev.map((it, i) =>
                              i === idx
                                ? { ...it, rejectedQty: val, acceptedQty: it.returnQty - val }
                                : it
                            )
                          );
                        }}
                        className="w-16 px-2 py-1 border rounded text-center text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-red-600">{ins.rejectedQty}</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {isEditable ? (
                      <select
                        value={ins.condition}
                        onChange={(e) => {
                          const c = e.target.value as ReturnCondition;
                          setInspections((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, condition: c } : it))
                          );
                        }}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        <option value="resellable">Resellable (Restock)</option>
                        <option value="damaged">Damaged (Quarantine)</option>
                        <option value="expired">Expired (Quarantine)</option>
                      </select>
                    ) : (
                      <Badge
                        variant={ins.condition === "resellable" ? "success" : "danger"}
                        className="capitalize"
                      >
                        {ins.condition}
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {isEditable ? (
                      <input
                        type="text"
                        value={ins.notes}
                        onChange={(e) => {
                          const n = e.target.value;
                          setInspections((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, notes: n } : it))
                          );
                        }}
                        placeholder="Observation notes..."
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <span className="text-xs text-gray-600">{ins.notes || "—"}</span>
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
