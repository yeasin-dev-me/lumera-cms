"use client";

import React, { useState } from "react";
import { useCMSAuth } from "@/lib/auth/auth-context";
import { Lock, Mail, ShieldAlert } from "lucide-react";

export function StaffLoginForm() {
  const { login, error, clearError } = useCMSAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch {
      // Error handled in CMSAuthContext
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-lumera-primary text-white items-center justify-center font-serif text-2xl font-bold mb-4 shadow-lg shadow-lumera-primary/20">
            L
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
            Lumera Operations CMS
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Restricted Staff Access — Authoritative Backend RBAC Enforced
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-800/60 flex items-start gap-3 text-red-200 text-xs">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Access Denied</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@lumera.internal"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-lumera-primary focus:border-transparent placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-lumera-primary focus:border-transparent placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-lumera-primary hover:bg-lumera-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "Authenticating Staff..." : "Sign In to CMS"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500">
              Only accounts with <code className="text-slate-400 font-mono">is_staff=true</code> and assigned roles are authorized.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
