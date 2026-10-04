"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { StaffLoginPayload, StaffUser } from "@/types/admin";

interface CMSAuthContextType {
  staffUser: StaffUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: StaffLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  clearError: () => void;
}

const CMSAuthContext = createContext<CMSAuthContextType | undefined>(undefined);

const CMS_REFRESH_KEY = "lumera_cms_staff_refresh";

export function CMSAuthProvider({ children }: { children: React.ReactNode }) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleAuthSuccess = useCallback((access: string, refresh: string, user: StaffUser) => {
    adminApi.setAccessToken(access);
    setStaffUser(user);
    setError(null);
    if (typeof window !== "undefined" && refresh) {
      localStorage.setItem(CMS_REFRESH_KEY, refresh);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedRefresh = typeof window !== "undefined" ? localStorage.getItem(CMS_REFRESH_KEY) : null;
      if (storedRefresh) {
        await adminApi.logout(storedRefresh);
      }
    } catch {
      // Ignore logout errors
    } finally {
      adminApi.setAccessToken(null);
      setStaffUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(CMS_REFRESH_KEY);
      }
      setIsLoading(false);
    }
  }, []);

  // Restore staff session on mount
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      if (typeof window === "undefined") return;
      const storedRefresh = localStorage.getItem(CMS_REFRESH_KEY);
      if (!storedRefresh) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const tokenResp = await adminApi.refresh(storedRefresh);
        adminApi.setAccessToken(tokenResp.access);
        if (tokenResp.refresh) {
          localStorage.setItem(CMS_REFRESH_KEY, tokenResp.refresh);
        }
        const profile = await adminApi.getMe();
        if (isMounted) {
          setStaffUser(profile);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          adminApi.setAccessToken(null);
          setStaffUser(null);
          localStorage.removeItem(CMS_REFRESH_KEY);
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: StaffLoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.login(credentials);
      handleAuthSuccess(response.access, response.refresh, response.user);
    } catch (err: unknown) {
      const message = err instanceof AdminApiError ? err.message : "Staff login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (!staffUser || !staffUser.is_staff) return false;
      const userPerms = staffUser.permissions || [];
      return userPerms.includes("*") || userPerms.includes(permissionCode);
    },
    [staffUser]
  );

  return (
    <CMSAuthContext.Provider
      value={{
        staffUser,
        permissions: staffUser?.permissions || [],
        isAuthenticated: !!staffUser,
        isLoading,
        error,
        login,
        logout,
        hasPermission,
        clearError,
      }}
    >
      {children}
    </CMSAuthContext.Provider>
  );
}

export function useCMSAuth() {
  const context = useContext(CMSAuthContext);
  if (!context) {
    throw new Error("useCMSAuth must be used within a CMSAuthProvider");
  }
  return context;
}
