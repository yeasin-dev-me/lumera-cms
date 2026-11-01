"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AccountingEventMapping } from "@/types/events";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Network,
  PlusCircle,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function EventMappingsPage() {
  const [mappings, setMappings] = useState<AccountingEventMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadMappings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getEventMappings();
      const list = Array.isArray(res) ? res : (res as any)?.results || [];
      setMappings(list);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load event mappings.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const filteredMappings = mappings.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.event_type.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Link href="/accounting" className="hover:text-neutral-900 transition-colors">
              Accounting
            </Link>
            <span>/</span>
            <Link href="/accounting/events" className="hover:text-neutral-900 transition-colors">
              Events
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Event Mappings</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Commercial Event Accounting Mappings</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Rule configurations connecting commercial transaction events to Double-Entry General Ledger accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadMappings} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/accounting/event-mappings/new">
            <Button variant="primary" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              New Mapping Rule
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter / Search Bar */}
      <Card className="p-4 border border-neutral-200 bg-white">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search event type or mapping name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </Card>

      {/* Mappings Table */}
      <Card className="overflow-hidden border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Active Version</th>
                <th className="py-3 px-4">Debit Account</th>
                <th className="py-3 px-4">Credit Account</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {loading && mappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Loading event mappings...
                  </td>
                </tr>
              ) : filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No accounting mappings configured yet. Click &quot;New Mapping Rule&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => {
                  const ver = m.current_version_details;
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-neutral-900">
                        {m.event_type}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900">{m.name}</div>
                        {m.description && <div className="text-xs text-neutral-500">{m.description}</div>}
                      </td>
                      <td className="py-3 px-4">
                        {ver ? (
                          <span className="font-mono text-xs font-medium">v{ver.version_number}</span>
                        ) : (
                          <span className="text-xs text-neutral-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {ver?.debit_account_code ? (
                          <span>
                            [{ver.debit_account_code}] {ver.debit_account_name}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Dynamic / Unset</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {ver?.credit_account_code ? (
                          <span>
                            [{ver.credit_account_code}] {ver.credit_account_name}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Dynamic / Unset</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {m.is_active && m.current_version_id ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Setup Required</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/accounting/event-mappings/${m.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            Manage Versions ({m.versions_count || 0})
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
