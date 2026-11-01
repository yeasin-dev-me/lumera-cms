"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Calendar } from "lucide-react";

interface PeriodSelectorProps {
  preset: string;
  onPresetChange: (preset: string) => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  onRefresh?: () => void;
  onApplyCustomRange?: () => void;
  loading?: boolean;
}

export const PERIOD_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  preset,
  onPresetChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onRefresh,
  onApplyCustomRange,
  loading = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Period:</span>
        <select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PERIOD_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={startDate || ""}
            onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate || ""}
            onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      <div className="ml-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh || onApplyCustomRange}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};
