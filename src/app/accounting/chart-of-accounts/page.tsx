"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { Account, AccountTreeNode, AccountType } from "@/types/accounting";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  FolderTree,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ArrowRight,
  List,
} from "lucide-react";

export default function ChartOfAccountsPage() {
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree");
  const [treeData, setTreeData] = useState<AccountTreeNode[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tree, flat] = await Promise.all([
        adminApi.getAccountTree(typeFilter ? { account_type: typeFilter } : {}),
        adminApi.getAccounts({
          account_type: typeFilter || undefined,
          search: searchQuery || undefined,
          page_size: 200,
        }),
      ]);
      setTreeData(tree);
      setFlatAccounts(flat.results || (flat as unknown as Account[]) || []);

      // Auto-expand top-level nodes in tree view
      const expanded: Record<number, boolean> = {};
      tree.forEach((node) => {
        expanded[node.id] = true;
      });
      setExpandedNodes(expanded);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load Chart of Accounts.");
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpand = (id: number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case "asset":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "liability":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "equity":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "revenue":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "expense":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const renderTreeNodes = (nodes: AccountTreeNode[], depth: number = 0) => {
    return nodes.map((node) => {
      const isExpanded = !!expandedNodes[node.id];
      const hasChildren = node.children && node.children.length > 0;

      return (
        <React.Fragment key={node.id}>
          <tr className="hover:bg-gray-50/70 transition-colors border-b border-gray-100">
            <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-900">
              <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(node.id)}
                    className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : (
                  <span className="w-6 mr-1" />
                )}
                <span className="font-bold">{node.code}</span>
              </div>
            </td>
            <td className="py-3 px-4">
              <Link
                href={`/accounting/chart-of-accounts/${node.id}`}
                className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {node.name}
              </Link>
              {node.is_group && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 uppercase font-semibold">
                  Group
                </span>
              )}
            </td>
            <td className="py-3 px-4">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded border uppercase ${getAccountTypeColor(
                  node.account_type
                )}`}
              >
                {node.account_type}
              </span>
            </td>
            <td className="py-3 px-4 uppercase text-xs font-mono text-gray-600">{node.normal_balance}</td>
            <td className="py-3 px-4 text-center">
              {node.allow_posting ? (
                <span className="text-emerald-600 font-semibold text-xs">Yes</span>
              ) : (
                <span className="text-gray-400 text-xs">No (Group)</span>
              )}
            </td>
            <td className="py-3 px-4 text-center">
              {node.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="muted">Inactive</Badge>
              )}
            </td>
            <td className="py-3 px-4 text-right">
              <Link href={`/accounting/chart-of-accounts/${node.id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View
                </Button>
              </Link>
            </td>
          </tr>
          {hasChildren && isExpanded && renderTreeNodes(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Authoritative five-category accounting taxonomy, normal balance governance, and hierarchical accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/accounting/chart-of-accounts/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Account
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter and View Controls */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account code or name..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Account Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classifications</option>
              <option value="asset">1xxx — Asset</option>
              <option value="liability">2xxx — Liability</option>
              <option value="equity">3xxx — Equity</option>
              <option value="revenue">4xxx — Revenue</option>
              <option value="expense">5xxx — Expense</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "tree" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              Tree View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Flat Table
            </button>
          </div>
        </div>
      </Card>

      {/* Main Account View */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Account Code</th>
                <th className="py-3 px-4 text-left font-medium">Account Name</th>
                <th className="py-3 px-4 text-left font-medium">Classification</th>
                <th className="py-3 px-4 text-left font-medium">Normal Balance</th>
                <th className="py-3 px-4 text-center font-medium">Allow Posting</th>
                <th className="py-3 px-4 text-center font-medium">Status</th>
                <th className="py-3 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {viewMode === "tree" ? (
                treeData.length > 0 ? (
                  renderTreeNodes(treeData)
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      {loading ? "Loading Chart of Accounts tree..." : "No accounts found matching criteria."}
                    </td>
                  </tr>
                )
              ) : flatAccounts.length > 0 ? (
                flatAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50/70 transition-colors border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900">{acc.code}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/accounting/chart-of-accounts/${acc.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {acc.name}
                      </Link>
                      {acc.is_group && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 uppercase font-semibold">
                          Group
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded border uppercase ${getAccountTypeColor(
                          acc.account_type
                        )}`}
                      >
                        {acc.account_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-xs font-mono text-gray-600">{acc.normal_balance}</td>
                    <td className="py-3 px-4 text-center">
                      {acc.allow_posting ? (
                        <span className="text-emerald-600 font-semibold text-xs">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No (Group)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {acc.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/accounting/chart-of-accounts/${acc.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {loading ? "Loading accounts list..." : "No accounts found matching criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

