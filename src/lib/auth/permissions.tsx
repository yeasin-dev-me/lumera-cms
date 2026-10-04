"use client";

import React, { createContext, useContext } from "react";
import { useCMSAuth } from "./auth-context";
import { StaffUser } from "@/types/admin";

interface PermissionsContextValue {
  user: StaffUser | null;
  permissions: string[];
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  user: null,
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
});

export const PermissionsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { staffUser, permissions, hasPermission: checkPerm } = useCMSAuth();

  const hasPermission = (code: string): boolean => {
    return checkPerm(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (!staffUser) return false;
    if (permissions.includes("*")) return true;
    return codes.some((code) => permissions.includes(code));
  };

  return (
    <PermissionsContext.Provider
      value={{ user: staffUser, permissions, hasPermission, hasAnyPermission }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

/**
 * Declarative component for permission-aware UI gating.
 * Renders children only when current staff user possesses the required permission.
 * NOTE: This is a UI-level guard and does NOT replace backend authorization.
 */
export const Can: React.FC<{
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, fallback = null, children }) => {
  const { hasPermission } = usePermissions();
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
