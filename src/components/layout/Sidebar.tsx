"use client";

import React from "react";
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

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

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
          label: "Customers",
          href: "/customers",
          icon: <Users className="h-4 w-4" />,
          permission: "customers.read",
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
      label: "Storefront Content",
      items: [
        {
          label: "Content Blocks",
          href: "/content",
          icon: <FileText className="h-4 w-4" />,
          permission: "content.read",
        },
        {
          label: "Promotions",
          href: "/promotions",
          icon: <Tag className="h-4 w-4" />,
          permission: "promotions.read",
        },
        {
          label: "Reviews Moderation",
          href: "/reviews",
          icon: <Star className="h-4 w-4" />,
          permission: "reviews.moderate",
        },
      ],
    },
    {
      label: "System & Governance",
      items: [
        {
          label: "Integrations & Tracking",
          href: "/integrations",
          icon: <Sliders className="h-4 w-4" />,
          permission: "integrations.read",
        },
        {
          label: "Staff & RBAC",
          href: "/staff",
          icon: <Shield className="h-4 w-4" />,
          permission: "staff.manage",
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

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-screen flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
          <div className="h-8 w-8 rounded bg-lumera-primary text-white flex items-center justify-center font-bold text-sm">
            LC
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide text-lumera-text block">
              LUMERA CMS
            </span>
            <span className="text-[10px] uppercase tracking-wider text-lumera-text-muted block">
              Operations Center
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="p-4 space-y-6">
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
        <p className="font-medium text-lumera-text">Lumera Operations</p>
        <p className="text-[10px] mt-0.5">Headless API Connected</p>
      </div>
    </aside>
  );
};
