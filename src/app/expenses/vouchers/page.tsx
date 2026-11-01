"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { ExpenseVoucher, ExpenseCategory, ExpenseVoucherStatus } from "@/types/expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function ExpenseVouchersPage() {
  const [vouchers, setVouchers] = useState<ExpenseVoucher[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {};
      if (selectedStatus) params.status = selectedStatus;
      if (selectedCategory) params.category_id = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const [voucherRes, catRes] = await Promise.all([
        adminApi.getExpenseVouchers(params),
        adminApi.getExpenseCategories(),
      ]);

      setVouchers(voucherRes.results || []);
      setCategories(catRes);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load expense vouchers.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMoney = (val: string | number) => {
    const num = Number(val || 0);
    return `৳${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderStatusBadge = (status: ExpenseVoucherStatus, display: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="muted">Draft</Badge>;
      case "pending_approval":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "approved":
        return <Badge variant="primary">Approved (Unpaid)</Badge>;
      case "partially_paid":
        return <Badge variant="accent">Partially Paid</Badge>;
      case "paid":
        return <Badge variant="success">Fully Paid</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="muted">Cancelled</Badge>;
      default:
        return <Badge variant="muted">{display}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Vouchers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative operating expenditure vouchers with maker-checker controls and Treasury disbursement records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/expenses/vouchers/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Voucher
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by voucher #, payee, memo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-3 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— All Statuses —</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved & Awaiting Payment</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Paid</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— All Categories —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Vouchers Table */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Voucher Number</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3.5 text-left font-medium text-gray-500">Payee & Memo</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Total Billed</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Disbursed</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Outstanding</th>
                <th className="px-4 py-3.5 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-right font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading expense vouchers...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No expense vouchers found matching the selected filters.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-blue-700">
                      <Link href={`/expenses/vouchers/${v.id}`} className="hover:underline">
                        {v.voucher_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{v.expense_date}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-gray-900">{v.category_name}</span>
                      <div className="font-mono text-gray-400 text-[10px]">{v.category_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{v.payee_name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{v.description}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatMoney(v.amount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(v.paid_amount)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{formatMoney(v.remaining_amount)}</td>
                    <td className="px-4 py-3 text-center">{renderStatusBadge(v.status, v.status_display)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/expenses/vouchers/${v.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

