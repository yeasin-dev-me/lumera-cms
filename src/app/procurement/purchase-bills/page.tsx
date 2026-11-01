"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseBill, PurchaseBillStatus } from "@/types/procurement";
import { usePermissions } from "@/lib/auth/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Receipt,
  PlusCircle,
  Search,
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Ban,
  Scale,
} from "lucide-react";

export default function PurchaseBillsPage() {
  const { hasPermission } = usePermissions();

  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPurchaseBills({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setBills(res.results);
      setTotalCount(res.count);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load purchase bills.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const getStatusBadge = (status: PurchaseBillStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="muted"><Clock className="h-3 w-3 mr-1 inline" />Draft</Badge>;
      case "posted":
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Posted (Capitalized)</Badge>;
      case "cancelled":
        return <Badge variant="danger"><Ban className="h-3 w-3 mr-1 inline" />Cancelled</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-indigo-600" />
            Purchase Bills & Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Supplier commercial billing, acquisition landed cost allocation, and FIFO inventory subledger posting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/procurement/landed-cost">
            <Button variant="secondary" className="flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Landed Cost Calculator
            </Button>
          </Link>
          {hasPermission("purchases.create") && (
            <Link href="/procurement/purchase-bills/new">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                New Purchase Bill
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Bill #, Invoice ref, supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadBills}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            Loading purchase bills...
          </div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No purchase bills found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3">Bill Number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Raw Subtotal (৳)</th>
                  <th className="px-4 py-3">Landed Costs (৳)</th>
                  <th className="px-4 py-3">Total Amount (৳)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-medium text-gray-900">{bill.bill_number}</div>
                      {bill.supplier_invoice_ref && (
                        <div className="text-xs text-gray-400 font-mono">
                          Ref: {bill.supplier_invoice_ref}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{bill.supplier_name}</div>
                      {bill.po_number && (
                        <div className="text-xs font-mono text-indigo-600">
                          PO: {bill.po_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>Bill: {bill.bill_date}</div>
                      <div className="text-gray-400">Due: {bill.due_date}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      ৳{parseFloat(bill.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-amber-700 font-medium">
                      +৳{parseFloat(bill.total_landed_costs).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      ৳{parseFloat(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/procurement/purchase-bills/${bill.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        View & Post
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalCount > pageSize && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalCount)} of {totalCount} bills
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
