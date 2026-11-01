"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { CreditNote } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileCheck,
  Ban,
  X,
  Receipt,
} from "lucide-react";

export default function CreditNoteDetailPage() {
  const params = useParams();
  const creditNoteId = params.id as string;

  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Void modal
  const [showVoidModal, setShowVoidModal] = useState<boolean>(false);
  const [voidReason, setVoidReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadCreditNote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getCreditNote(creditNoteId);
      setCreditNote(data);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load credit note details.");
      }
    } finally {
      setLoading(false);
    }
  }, [creditNoteId]);

  useEffect(() => {
    loadCreditNote();
  }, [loadCreditNote]);

  const handleIssueCreditNote = async () => {
    if (!creditNote) return;
    setActionLoading(true);
    setError(null);

    try {
      const updated = await adminApi.issueCreditNote(creditNote.id);
      setCreditNote(updated);
      setSuccessMsg(`Credit Note ${updated.credit_note_number} successfully issued.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to issue credit note.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNote || !voidReason.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      const updated = await adminApi.voidCreditNote(creditNote.id, voidReason);
      setShowVoidModal(false);
      setCreditNote(updated);
      setSuccessMsg(`Credit Note ${updated.credit_note_number} voided.`);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to void credit note.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-600" />
        Loading credit note details...
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Credit note not found.</p>
        <Link href="/sales/credit-notes">
          <Button variant="secondary">Back to Credit Notes</Button>
        </Link>
      </div>
    );
  }

  const isDraft = creditNote.status === "draft";
  const isIssued = creditNote.status === "issued";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sales/credit-notes">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {creditNote.credit_note_number}
              </h1>
              {creditNote.status === "issued" ? (
                <Badge variant="success">Issued</Badge>
              ) : creditNote.status === "draft" ? (
                <Badge variant="warning">Draft</Badge>
              ) : creditNote.status === "void" ? (
                <Badge variant="danger">Void</Badge>
              ) : (
                <Badge variant="muted">{creditNote.status}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Referenced Invoice:{" "}
              <Link
                href={`/sales/invoices/${creditNote.invoice}`}
                className="font-mono text-primary-600 hover:underline"
              >
                {creditNote.invoice_number}
              </Link>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button
              size="sm"
              onClick={handleIssueCreditNote}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <FileCheck className="h-4 w-4 mr-1.5" />
              Issue Credit Note
            </Button>
          )}

          {isIssued && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowVoidModal(true)}
              disabled={actionLoading}
            >
              <Ban className="h-4 w-4 mr-1.5" />
              Void Credit Note
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Credit Amount
          </span>
          <p className="text-2xl font-bold text-primary-600">৳{creditNote.grand_total}</p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Reason / Commercial Grounds
          </span>
          <p className="text-sm font-medium text-gray-800">{creditNote.reason}</p>
        </Card>

        <Card className="p-4 space-y-1 text-xs">
          <span className="font-semibold text-gray-500 uppercase tracking-wider block">
            Audit Trail
          </span>
          <div className="space-y-1 text-gray-600">
            <div>Created: {new Date(creditNote.created_at).toLocaleDateString()}</div>
            {creditNote.issued_by_email && <div>Issued By: {creditNote.issued_by_email}</div>}
            {creditNote.voided_by_email && (
              <div className="text-red-600">
                Voided By: {creditNote.voided_by_email} ({creditNote.void_reason})
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm">
            Credit Adjustment Line Items ({creditNote.items?.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4 text-center">Adjusted Qty</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right">Line Credit Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {(creditNote.items || []).map((it) => (
                <tr key={it.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 block">{it.product_name}</span>
                    <span className="font-mono text-xs text-gray-400">{it.product_sku}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-gray-900">{it.quantity}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">
                    ৳{it.unit_price}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-primary-700">
                    ৳{it.total_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" />
                Void Credit Note
              </h3>
              <button
                onClick={() => setShowVoidModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVoidCreditNote} className="space-y-4">
              <p className="text-xs text-gray-600">
                Voiding this credit note restores the invoice&apos;s creditable balance.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Voiding *
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Issued in error, customer declined credit..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowVoidModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Void
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
