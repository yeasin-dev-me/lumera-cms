"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Tag,
  FileText,
  Star,
  Settings,
  Shield,
  Sliders,
  History,
  Mail,
  X,
} from "lucide-react";
import { usePermissions } from "@/lib/auth/permissions";

interface NavGroup {
  label: string;
  items: {
    label: string;
    href: string;
    icon: React.ReactNode;
    permission: string;
  }[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onClose) onClose();
  }, [pathname]);

  const navigation: NavGroup[] = [
    {
      label: "Operations",
      items: [
        {
          label: "Dashboard",
          href: "/",
          icon: <LayoutDashboard className="h-4 w-4" />,
          permission: "dashboard.read",
        },
        {
          label: "Orders",
          href: "/orders",
          icon: <ShoppingBag className="h-4 w-4" />,
          permission: "orders.read",
        },
        {
          label: "Returns",
          href: "/returns",
          icon: <ShoppingBag className="h-4 w-4" />,
          permission: "orders.read",
        },
        {
          label: "Customers",
          href: "/customers",
          icon: <Users className="h-4 w-4" />,
          permission: "customers.read",
        },
        {
          label: "Notifications",
          href: "/notifications",
          icon: <Mail className="h-4 w-4" />,
          permission: "notifications.read",
        },
      ],
    },
    {
      label: "Catalog",
      items: [
        {
          label: "Products",
          href: "/products",
          icon: <Package className="h-4 w-4" />,
          permission: "products.read",
        },
        {
          label: "Categories",
          href: "/categories",
          icon: <Layers className="h-4 w-4" />,
          permission: "categories.read",
        },
      ],
    },
    {
      label: "Content & Marketing",
      items: [
        {
          label: "Content Blocks",
          href: "/content",
          icon: <FileText className="h-4 w-4" />,
          permission: "content.read",
        },
        {
          label: "Campaigns",
          href: "/campaigns",
          icon: <Tag className="h-4 w-4" />,
          permission: "campaigns.read",
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          label: "Staff & RBAC",
          href: "/staff",
          icon: <Shield className="h-4 w-4" />,
          permission: "users.manage",
        },
        {
          label: "Audit Logs",
          href: "/audit",
          icon: <History className="h-4 w-4" />,
          permission: "audit.read",
        },
        {
          label: "Settings",
          href: "/settings",
          icon: <Settings className="h-4 w-4" />,
          permission: "settings.read",
        },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-full overflow-hidden shadow-sm ring-1 ring-border shrink-0">
              <Image
                src="/penguin-mart-logo.jpg"
                alt="Penguin Mart Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide text-lumera-text block">
                PENGUIN MART
              </span>
              <span className="text-[10px] uppercase tracking-wider text-lumera-text-muted block">
                Operations CMS
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-lumera-text-muted hover:text-lumera-text hover:bg-surface-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {navigation.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                <h6 className="px-2.5 text-[11px] font-semibold text-lumera-text-muted uppercase tracking-wider mb-1">
                  {group.label}
                </h6>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-lumera-primary text-white"
                          : "text-lumera-text hover:bg-surface-muted"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border text-[11px] text-lumera-text-muted">
        <p className="font-medium text-lumera-text">Penguin Mart Operations</p>
        <p className="text-[10px] mt-0.5">Headless API Connected</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-border min-h-screen flex-col justify-between shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border flex flex-col justify-between md:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
};
