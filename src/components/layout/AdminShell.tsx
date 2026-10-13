"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useCMSAuth } from "@/lib/auth/auth-context";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useCMSAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="h-8 w-8 rounded-full border-2 border-lumera-primary border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Verifying Staff Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <StaffLoginForm />;
  }

  return (
    <div className="flex min-h-screen bg-background text-lumera-text">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
