"use client";

import React, { createContext, useContext, useState } from "react";
import { StaffUser } from "@/types/admin";

interface PermissionsContextValue {
  user: StaffUser | null;
  permissions: string[];
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  setUser: (user: StaffUser | null) => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  user: null,
  permissions: [],
  hasPermission: () => true, // default optimistic in foundation until authenticated
  hasAnyPermission: () => true,
  setUser: () => {},
});

export const PermissionsProvider: React.FC<{
  children: React.ReactNode;
  initialUser?: StaffUser | null;
}> = ({ children, initialUser = null }) => {
  const [user, setUser] = useState<StaffUser | null>(initialUser);

  const permissions = user?.permissions || [];

  const hasPermission = (code: string): boolean => {
    if (!user) return true; // Foundation mode allows viewing placeholder UI shells
    if (permissions.includes("*")) return true;
    return permissions.includes(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (!user) return true;
    if (permissions.includes("*")) return true;
    return codes.some((code) => permissions.includes(code));
  };

  return (
    <PermissionsContext.Provider
      value={{ user, permissions, hasPermission, hasAnyPermission, setUser }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

/**
 * Declarative component for permission-aware UI gating.
 * Renders children only when current staff user possesses the required permission.
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
