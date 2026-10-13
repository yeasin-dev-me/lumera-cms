"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin-client";
import { Activity, ShieldCheck, UserCheck, LogOut, Menu } from "lucide-react";
import { useCMSAuth } from "@/lib/auth/auth-context";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [health, setHealth] = useState<string>("Checking...");
  const { staffUser, logout } = useCMSAuth();

  useEffect(() => {
    adminApi
      .getHealth()
      .then((res) => setHealth(res.status))
      .catch(() => setHealth("unavailable"));
  }, []);

  return (
    <header className="h-16 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 sm:gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-lumera-text hover:bg-surface-muted transition-colors"
            aria-label="Open operations navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-xs sm:text-sm font-semibold text-lumera-text">
          Control Center
        </h2>
        <span className="text-border hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          <Activity
            className={`h-3.5 w-3.5 ${
              health === "ok" ? "text-lumera-success animate-pulse" : "text-lumera-danger"
            }`}
          />
          <span className="text-lumera-text-muted">API:</span>
          <span
            className={`font-mono text-[11px] font-semibold uppercase ${
              health === "ok" ? "text-lumera-success" : "text-lumera-danger"
            }`}
          >
            {health}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded bg-surface-muted text-[11px] sm:text-xs border border-border">
          <ShieldCheck className="h-3.5 w-3.5 text-lumera-primary shrink-0" />
          <span className="text-lumera-text font-medium truncate max-w-[90px] sm:max-w-none">
            {staffUser?.permissions.includes("*") ? "Super Admin" : "Staff"}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-border">
          <div className="h-7 w-7 rounded-full bg-lumera-primary/10 text-lumera-primary flex items-center justify-center font-semibold text-xs shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="text-left hidden lg:block">
            <span className="text-xs font-semibold text-lumera-text block leading-tight">
              {staffUser ? staffUser.first_name || staffUser.email.split("@")[0] : "Staff"}
            </span>
            <span className="text-[10px] text-lumera-text-muted block leading-tight">
              {staffUser?.email}
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 sm:px-2 sm:py-1 rounded text-xs text-lumera-text-muted hover:text-lumera-danger hover:bg-surface-muted transition-colors flex items-center gap-1"
            title="Log out of CMS session"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
