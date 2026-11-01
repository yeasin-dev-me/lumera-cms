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
  Compass,
  X,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  ClipboardCheck,
  Building2,
  Truck,
  Receipt,
  Scale,
  Store,
  RotateCcw,
  CreditCard,
  Landmark,
  Wallet,
  CircleDollarSign,
  PiggyBank,
  FileSpreadsheet,
  TrendingDown,
  Coins,
  FolderTree,
  CheckSquare,
  Activity,
  Network,
  TrendingUp,
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
          label: "Notifications",
          href: "/notifications",
          icon: <Mail className="h-4 w-4" />,
          permission: "notifications.read",
        },
      ],
    },
    {
      label: "Catalog & Inventory",
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
        {
          label: "Stock Summary",
          href: "/inventory",
          icon: <Boxes className="h-4 w-4" />,
          permission: "inventory.read",
        },
        {
          label: "Movement Ledger",
          href: "/inventory/movements",
          icon: <ArrowLeftRight className="h-4 w-4" />,
          permission: "inventory.read",
        },
        {
          label: "Batch & Expiry",
          href: "/inventory/batches",
          icon: <CalendarClock className="h-4 w-4" />,
          permission: "inventory.read",
        },
        {
          label: "Stock Adjustments",
          href: "/inventory/adjustments",
          icon: <ClipboardCheck className="h-4 w-4" />,
          permission: "inventory.read",
        },
      ],
    },
    {
      label: "Procurement & Purchasing",
      items: [
        {
          label: "Suppliers",
          href: "/procurement/suppliers",
          icon: <Building2 className="h-4 w-4" />,
          permission: "suppliers.read",
        },
        {
          label: "Purchase Orders",
          href: "/procurement/purchase-orders",
          icon: <FileText className="h-4 w-4" />,
          permission: "purchases.read",
        },
        {
          label: "Goods Receipts (GRN)",
          href: "/procurement/receipts",
          icon: <Truck className="h-4 w-4" />,
          permission: "purchases.read",
        },
        {
          label: "Purchase Bills",
          href: "/procurement/purchase-bills",
          icon: <Receipt className="h-4 w-4" />,
          permission: "purchases.read",
        },
        {
          label: "Landed Cost Allocator",
          href: "/procurement/landed-cost",
          icon: <Scale className="h-4 w-4" />,
          permission: "purchases.read",
        },
      ],
    },
    {
      label: "Sales & Invoicing",
      items: [
        {
          label: "POS Counter",
          href: "/sales/pos",
          icon: <Store className="h-4 w-4" />,
          permission: "sales.read",
        },
        {
          label: "Sales Invoices",
          href: "/sales/invoices",
          icon: <Receipt className="h-4 w-4" />,
          permission: "sales.read",
        },
        {
          label: "POS Sessions",
          href: "/sales/pos/sessions",
          icon: <History className="h-4 w-4" />,
          permission: "sales.read",
        },
        {
          label: "Sales Returns",
          href: "/sales/returns",
          icon: <RotateCcw className="h-4 w-4" />,
          permission: "sales.read",
        },
        {
          label: "Credit Notes",
          href: "/sales/credit-notes",
          icon: <CreditCard className="h-4 w-4" />,
          permission: "sales.read",
        },
      ],
    },
    {
      label: "Customers & Receivables",
      items: [
        {
          label: "Customer Directory",
          href: "/customers",
          icon: <Users className="h-4 w-4" />,
          permission: "customers.read",
        },
        {
          label: "Credit Applications",
          href: "/customers/credit-applications",
          icon: <ClipboardCheck className="h-4 w-4" />,
          permission: "customers.credit_read",
        },
        {
          label: "Receivables Dashboard",
          href: "/customers/receivables",
          icon: <Receipt className="h-4 w-4" />,
          permission: "customers.ledger_read",
        },
        {
          label: "Receivable Aging",
          href: "/customers/receivables/aging",
          icon: <CalendarClock className="h-4 w-4" />,
          permission: "customers.ledger_read",
        },
      ],
    },
    {
      label: "Treasury & Finance",
      items: [
        {
          label: "Treasury Dashboard",
          href: "/treasury",
          icon: <LayoutDashboard className="h-4 w-4" />,
          permission: "treasury.read",
        },
        {
          label: "Financial Accounts",
          href: "/treasury/accounts",
          icon: <Landmark className="h-4 w-4" />,
          permission: "treasury.read",
        },
        {
          label: "Fund Transfers",
          href: "/treasury/transfers",
          icon: <ArrowLeftRight className="h-4 w-4" />,
          permission: "treasury.transfer",
        },
        {
          label: "Customer Receipts",
          href: "/treasury/customer-receipts",
          icon: <Receipt className="h-4 w-4" />,
          permission: "treasury.receipt_create",
        },
        {
          label: "Supplier Disbursements",
          href: "/treasury/supplier-payments",
          icon: <CreditCard className="h-4 w-4" />,
          permission: "treasury.supplier_payment",
        },
        {
          label: "Gateway Settlement",
          href: "/treasury/settlements/gateway",
          icon: <CircleDollarSign className="h-4 w-4" />,
          permission: "treasury.settlement_import",
        },
        {
          label: "Courier COD Remittance",
          href: "/treasury/settlements/courier",
          icon: <Truck className="h-4 w-4" />,
          permission: "treasury.settlement_import",
        },
        {
          label: "Bank Reconciliation",
          href: "/treasury/reconciliation/bank",
          icon: <Scale className="h-4 w-4" />,
          permission: "treasury.reconcile",
        },
        {
          label: "Cash Reconciliation",
          href: "/treasury/reconciliation/cash",
          icon: <Wallet className="h-4 w-4" />,
          permission: "treasury.cash_count",
        },
      ],
    },
    {
      label: "Expense Management",
      items: [
        {
          label: "Expense Dashboard",
          href: "/expenses",
          icon: <LayoutDashboard className="h-4 w-4" />,
          permission: "expenses.read",
        },
        {
          label: "Expense Vouchers",
          href: "/expenses/vouchers",
          icon: <Receipt className="h-4 w-4" />,
          permission: "expenses.read",
        },
        {
          label: "Approval Queue",
          href: "/expenses/approvals",
          icon: <CheckSquare className="h-4 w-4" />,
          permission: "expenses.approve",
        },
        {
          label: "Expense Categories",
          href: "/expenses/categories",
          icon: <FolderTree className="h-4 w-4" />,
          permission: "expenses.read",
        },
        {
          label: "Disbursement Ledger",
          href: "/expenses/disbursements",
          icon: <CreditCard className="h-4 w-4" />,
          permission: "expenses.read",
        },
        {
          label: "Expense Reports",
          href: "/expenses/reports",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          permission: "expenses.reports_view",
        },
      ],
    },
    {
      label: "Capital & Financing",
      items: [
        {
          label: "Capital Contributions",
          href: "/finance/capital",
          icon: <PiggyBank className="h-4 w-4" />,
          permission: "capital.view",
        },
        {
          label: "Loan Management",
          href: "/finance/loans",
          icon: <Coins className="h-4 w-4" />,
          permission: "loans.view",
        },
        {
          label: "Owner Drawings",
          href: "/finance/owner-drawings",
          icon: <TrendingDown className="h-4 w-4" />,
          permission: "drawings.view",
        },
      ],
    },
    {
      label: "Double-Entry Accounting",
      items: [
        {
          label: "Accounting Dashboard",
          href: "/accounting",
          icon: <LayoutDashboard className="h-4 w-4" />,
          permission: "accounting.view_journalentry",
        },
        {
          label: "Chart of Accounts",
          href: "/accounting/chart-of-accounts",
          icon: <FolderTree className="h-4 w-4" />,
          permission: "accounting.view_account",
        },
        {
          label: "Journal Entries",
          href: "/accounting/journals",
          icon: <Receipt className="h-4 w-4" />,
          permission: "accounting.view_journalentry",
        },
        {
          label: "Approval Queue",
          href: "/accounting/journals/approvals",
          icon: <CheckSquare className="h-4 w-4" />,
          permission: "accounting.approve_journalentry",
        },
        {
          label: "Accounting Periods",
          href: "/accounting/periods",
          icon: <CalendarClock className="h-4 w-4" />,
          permission: "accounting.view_accountingperiod",
        },
        {
          label: "Trial Balance",
          href: "/accounting/trial-balance",
          icon: <Scale className="h-4 w-4" />,
          permission: "accounting.view_trialbalance",
        },
        {
          label: "General Ledger",
          href: "/accounting/general-ledger",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          permission: "accounting.view_generalledger",
        },
        {
          label: "Journal Register",
          href: "/accounting/journal-register",
          icon: <History className="h-4 w-4" />,
          permission: "accounting.view_journalregister",
        },
      ],
    },
    {
      label: "Commercial Event Integration",
      items: [
        {
          label: "Outbox Queue",
          href: "/accounting/events/queue",
          icon: <Activity className="h-4 w-4" />,
          permission: "events.view_accountingevent",
        },
        {
          label: "Event Mappings",
          href: "/accounting/event-mappings",
          icon: <Network className="h-4 w-4" />,
          permission: "events.view_accountingeventmapping",
        },
        {
          label: "Treasury Mappings",
          href: "/accounting/treasury-mappings",
          icon: <Building2 className="h-4 w-4" />,
          permission: "events.view_treasuryaccountmapping",
        },
        {
          label: "Subledger Reconciliation",
          href: "/accounting/reconciliation",
          icon: <Scale className="h-4 w-4" />,
          permission: "events.reconcile_accountingevent",
        },
      ],
    },
    {
      label: "Financial Reporting",
      items: [
        {
          label: "Reporting Overview",
          href: "/reports",
          icon: <LayoutDashboard className="h-4 w-4" />,
          permission: "reporting.view_financialreport",
        },
        {
          label: "Profit & Loss",
          href: "/reports/profit-loss",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          permission: "reporting.view_financialreport",
        },
        {
          label: "Balance Sheet",
          href: "/reports/balance-sheet",
          icon: <Scale className="h-4 w-4" />,
          permission: "reporting.view_financialreport",
        },
        {
          label: "Statement of Cash Flows",
          href: "/reports/cash-flow",
          icon: <Coins className="h-4 w-4" />,
          permission: "reporting.view_financialreport",
        },
        {
          label: "Comparative Statements",
          href: "/reports/comparative",
          icon: <TrendingUp className="h-4 w-4" />,
          permission: "reporting.view_financialreport",
        },
        {
          label: "Statement Mappings",
          href: "/reports/statement-mappings",
          icon: <Network className="h-4 w-4" />,
          permission: "reporting.view_statementmapping",
        },
        {
          label: "Cash Flow Mappings",
          href: "/reports/cash-flow-mappings",
          icon: <FolderTree className="h-4 w-4" />,
          permission: "reporting.view_statementmapping",
        },
        {
          label: "Reporting Validation",
          href: "/reports/validation",
          icon: <ClipboardCheck className="h-4 w-4" />,
          permission: "reporting.validate_financialreport",
        },
        {
          label: "Report Snapshots",
          href: "/reports/snapshots",
          icon: <History className="h-4 w-4" />,
          permission: "reporting.view_reportsnapshot",
        },
      ],
    },
    {
      label: "Analytics & Intelligence",
      items: [
        {
          label: "Executive Dashboard",
          href: "/analytics",
          icon: <LayoutDashboard className="h-4 w-4" />,
          permission: "analytics.view_executive",
        },
        {
          label: "Sales Performance",
          href: "/analytics/sales",
          icon: <ShoppingBag className="h-4 w-4" />,
          permission: "analytics.view_sales",
        },
        {
          label: "Product Analytics",
          href: "/analytics/products",
          icon: <Package className="h-4 w-4" />,
          permission: "analytics.view_products",
        },
        {
          label: "Inventory Health",
          href: "/analytics/inventory",
          icon: <Boxes className="h-4 w-4" />,
          permission: "analytics.view_inventory",
        },
        {
          label: "Procurement & Suppliers",
          href: "/analytics/procurement",
          icon: <Truck className="h-4 w-4" />,
          permission: "analytics.view_procurement",
        },
        {
          label: "Customer Intelligence",
          href: "/analytics/customers",
          icon: <Users className="h-4 w-4" />,
          permission: "analytics.view_customers",
        },
        {
          label: "Treasury & Liquidity",
          href: "/analytics/treasury",
          icon: <Landmark className="h-4 w-4" />,
          permission: "analytics.view_treasury",
        },
        {
          label: "Expenses & Profitability",
          href: "/analytics/expenses",
          icon: <TrendingDown className="h-4 w-4" />,
          permission: "analytics.view_expenses",
        },
        {
          label: "Business Trends",
          href: "/analytics/trends",
          icon: <TrendingUp className="h-4 w-4" />,
          permission: "analytics.view_trends",
        },
        {
          label: "Actionable Alerts",
          href: "/analytics/alerts",
          icon: <Activity className="h-4 w-4" />,
          permission: "analytics.view_alerts",
        },
        {
          label: "Alert Rules",
          href: "/analytics/alerts/rules",
          icon: <Sliders className="h-4 w-4" />,
          permission: "analytics.manage_alert_rules",
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
        {
          label: "Navigation",
          href: "/content/navigation",
          icon: <Compass className="h-4 w-4" />,
          permission: "content.read",
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
          label: "Business Settings",
          href: "/settings/business",
          icon: <Sliders className="h-4 w-4" />,
          permission: "business.manage",
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
