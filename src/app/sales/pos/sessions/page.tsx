"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { POSSession, OpenPOSSessionInput, ClosePOSSessionInput } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  History,
  Store,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  DollarSign,
  ArrowRight,
  X,
  CreditCard,
  Smartphone,
} from "lucide-react";

export default function POSSessionsPage() {
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Open modal
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [openingCash, setOpeningCash] = useState<string>("500.00");
  const [registerName, setRegisterName] = useState<string>("Counter-01");
  const [openingLoading, setOpeningLoading] = useState<boolean>(false);

  // Close modal
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [closingCash, setClosingCash] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [closingLoading, setClosingLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsRes, activeRes] = await Promise.all([
        adminApi.getPosSessions({ page, page_size: 20 }),
        adminApi.getActivePosSession().catch(() => null),
      ]);
      setSessions(sessionsRes.results || []);
      setTotalCount(sessionsRes.count || 0);
      setActiveSession(activeRes);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load POS sessions.");
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpeningLoading(true);
    setError(null);
    try {
      const payload: OpenPOSSessionInput = {
        opening_cash: openingCash,
        register_name: registerName,
      };
      const newSession = await adminApi.openPosSession(payload);
      setActiveSession(newSession);
      setShowOpenModal(false);
      setSuccessMsg(`POS Session ${newSession.session_number} successfully opened.`);
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to open POS session.");
      }
    } finally {
      setOpeningLoading(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setClosingLoading(true);
    setError(null);
    try {
      const payload: ClosePOSSessionInput = {
        closing_cash_counted: closingCash || "0.00",
        closing_notes: closingNotes,
      };
      const closed = await adminApi.closePosSession(activeSession.id, payload);
      setShowCloseModal(false);
      setSuccessMsg(
        `Session ${closed.session_number} closed. Discrepancy: ৳${closed.cash_discrepancy}`
      );
      loadData();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to close POS session.");
      }
    } finally {
      setClosingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <History className="h-6 w-6 text-primary-600" />
            POS Register Sessions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage cashier shift terminals, cash-drawer floats, and end-of-day reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {activeSession ? (
            <Link href="/sales/pos">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Store className="h-4 w-4 mr-2" />
                Go to POS Counter
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowOpenModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Open New Session
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Active Session Cockpit */}
      {activeSession ? (
        <Card className="border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-100 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{activeSession.session_number}</h2>
                <Badge variant="success" className="animate-pulse">Active Shift</Badge>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
                  {activeSession.register_name}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Cashier: <strong className="text-gray-900">{activeSession.cashier_name || activeSession.cashier_email}</strong> •
                Opened at: {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/sales/pos">
                <Button variant="secondary" size="sm" className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50">
                  <Store className="h-4 w-4 mr-2" />
                  Terminal Screen
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setClosingCash(activeSession.expected_cash || activeSession.opening_cash);
                  setShowCloseModal(true);
                }}
              >
                Close Register
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Opening Float</span>
              <p className="text-lg font-bold text-gray-900 mt-1">৳{activeSession.opening_cash}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Total Sales</span>
              <p className="text-lg font-bold text-primary-600 mt-1">৳{activeSession.total_sales_amount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-600" /> Cash Tender
              </span>
              <p className="text-lg font-bold text-gray-900 mt-1">৳{activeSession.total_cash_sales}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-blue-600" /> Card Slips
              </span>
              <p className="text-lg font-bold text-gray-900 mt-1">৳{activeSession.total_card_sales}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Smartphone className="h-3 w-3 text-pink-600" /> bKash QR
              </span>
              <p className="text-lg font-bold text-gray-900 mt-1">৳{activeSession.total_bkash_sales}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs text-emerald-800 font-medium">Expected Drawer</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">৳{activeSession.expected_cash}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center border-dashed border-gray-300">
          <Store className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-gray-800">No Register Shift Currently Open</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Open a register shift with starting drawer float to begin ringing up sales at POS counter.
          </p>
          <Button onClick={() => setShowOpenModal(true)} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Open Register Shift
          </Button>
        </Card>
      )}

      {/* Sessions History Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 text-sm">Shift History ({totalCount})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Session Number</th>
                <th className="py-3 px-4">Register</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Total Sales</th>
                <th className="py-3 px-4 text-right">Discrepancy</th>
                <th className="py-3 px-4">Opened / Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading session log...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => {
                  const discrepancyVal = parseFloat(sess.cash_discrepancy || "0");
                  return (
                    <tr key={sess.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        {sess.session_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600">{sess.register_name}</td>
                      <td className="py-3 px-4">{sess.cashier_name || sess.cashier_email}</td>
                      <td className="py-3 px-4">
                        {sess.status === "open" ? (
                          <Badge variant="success">Open</Badge>
                        ) : (
                          <Badge variant="muted">Closed</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">৳{sess.opening_cash}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        ৳{sess.total_sales_amount}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {discrepancyVal === 0 ? (
                          <span className="text-emerald-600">৳0.00</span>
                        ) : (
                          <span className="text-red-600 font-bold">
                            ৳{sess.cash_discrepancy}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        <div>Open: {new Date(sess.opened_at).toLocaleDateString()} {new Date(sess.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {sess.closed_at && (
                          <div className="text-gray-400">
                            Closed: {new Date(sess.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <Store className="h-5 w-5 text-primary-600" />
                Open Cashier Shift
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Terminal / Register Name
                </label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Counter-01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Starting Cash Float (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-400 mt-1 block">
                  Exact physical bills and coins placed in the register drawer.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={openingLoading} className="bg-primary-600 text-white">
                  {openingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Shift
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Close Register & Reconcile
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Opening Float:</span>
                  <span className="font-medium text-gray-900">৳{activeSession.opening_cash}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Sales Taken:</span>
                  <span className="font-medium text-gray-900">৳{activeSession.total_cash_sales}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1 text-gray-900">
                  <span>Expected Drawer Cash:</span>
                  <span className="text-emerald-700">৳{activeSession.expected_cash}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Actual Physical Cash Counted (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {closingCash && (
                <div className="text-xs">
                  {parseFloat(closingCash) - parseFloat(activeSession.expected_cash) === 0 ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Perfect balance. Zero discrepancy.
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Discrepancy: ৳
                      {(parseFloat(closingCash) - parseFloat(activeSession.expected_cash)).toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reconciliation Notes
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Explain any drawer overage or shortage..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowCloseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={closingLoading}>
                  {closingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Shift Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
