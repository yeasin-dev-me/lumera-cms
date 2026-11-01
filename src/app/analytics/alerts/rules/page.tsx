"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { AlertRule, AlertSeverity } from "@/types/analytics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Sliders,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit2,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";

export default function AlertRulesConfigPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [thresholdInput, setThresholdInput] = useState<string>("");
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAlertRules();
      setRules(res);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Failed to load alert rules.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleOpenEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setThresholdInput(rule.threshold_value || "");
    setIsActiveInput(rule.is_active);
    setSaveError(null);
  };

  const handleCloseEdit = () => {
    setEditingRule(null);
    setThresholdInput("");
    setSaveError(null);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      setSaving(true);
      setSaveError(null);
      await adminApi.updateAlertRule(editingRule.id, {
        threshold_value: thresholdInput,
        is_active: isActiveInput,
      });
      handleCloseEdit();
      loadRules();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to save rule settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: AlertRule) => {
    try {
      await adminApi.updateAlertRule(rule.id, {
        is_active: !rule.is_active,
      });
      loadRules();
    } catch (err) {
      console.error("Failed to toggle rule status:", err);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger">CRITICAL</Badge>;
      case "warning":
        return <Badge variant="warning">WARNING</Badge>;
      default:
        return <Badge variant="primary">INFO</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/analytics/alerts"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Alerts Management
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-indigo-600" />
            Alert Rule Threshold Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Configure automated surveillance rules, trigger logic, and parameter thresholds.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Failed to Load Rules">
          {error}
        </Alert>
      )}

      {/* Rules Table */}
      <Card className="p-5 bg-white border-slate-200">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading alert rules...</div>
        ) : rules.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No alert rules configured in the system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-2.5">Rule Code & Name</th>
                  <th className="py-2.5">Domain</th>
                  <th className="py-2.5">Severity</th>
                  <th className="py-2.5">Trigger Condition</th>
                  <th className="py-2.5 text-right">Threshold</th>
                  <th className="py-2.5 text-center">Active</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="font-semibold text-slate-900">{rule.name}</div>
                      <div className="font-mono text-xs text-slate-400">{rule.code}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{rule.description}</div>
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-600 uppercase">
                      {rule.domain}
                    </td>
                    <td className="py-3">
                      {getSeverityBadge(rule.severity)}
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-700">
                      {rule.trigger_condition}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {rule.threshold_value}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                          rule.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {rule.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(rule)}
                        className="text-xs inline-flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Configure
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                Configure Rule: {editingRule.code}
              </h3>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">{editingRule.description}</p>

            {saveError && (
              <Alert variant="danger" title="Error Saving Rule">
                {saveError}
              </Alert>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trigger Condition (Read-only Formula):
                </label>
                <div className="font-mono text-xs bg-slate-100 p-2 rounded text-slate-800">
                  {editingRule.trigger_condition}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Threshold Value:
                </label>
                <input
                  type="text"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  placeholder="e.g. 5, 100000.00"
                  className="w-full text-xs font-mono rounded border border-slate-300 p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleActive"
                  checked={isActiveInput}
                  onChange={(e) => setIsActiveInput(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="ruleActive" className="text-xs font-medium text-slate-700">
                  Rule Active (Evaluated during periodic analytics cycles)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRule}
                isLoading={saving}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

