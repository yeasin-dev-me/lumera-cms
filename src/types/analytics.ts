export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";

export interface AnalyticsPeriod {
  preset: string;
  start_date: string;
  end_date: string;
}

export interface MetricDefinition {
  id: number;
  public_id: string;
  metric_code: string;
  name: string;
  domain: string;
  formula: string;
  source_module: string;
  date_basis: string;
  status_filters: Record<string, any>;
  is_financial: boolean;
  data_freshness_type: string;
  known_limitations: string;
}

export interface AlertRule {
  id: number;
  public_id: string;
  code: string;
  name: string;
  domain: string;
  severity: AlertSeverity;
  trigger_condition: string;
  threshold_value: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertRecord {
  id: number;
  public_id: string;
  rule: AlertRule | null;
  severity: AlertSeverity;
  domain: string;
  title: string;
  message: string;
  source_module: string;
  source_reference: string;
  metric_value: string | null;
  threshold_value: string | null;
  status: AlertStatus;
  acknowledged_by: { id: number; email: string; full_name?: string } | null;
  acknowledged_at: string | null;
  acknowledgement_notes: string;
  resolved_by: { id: number; email: string; full_name?: string } | null;
  resolved_at: string | null;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutiveDashboardData {
  period: AnalyticsPeriod;
  currency: string;
  currency_warning: string | null;
  data_freshness: string;
  generated_at: string;
  sales: {
    gross_sales: string;
    net_sales: string;
    invoice_count: number;
    pos_transaction_count: number;
    average_invoice_value: string;
    sales_growth_pct: string | null;
  };
  financial_performance: {
    completeness_status: string;
    currency_warning: string | null;
    recognized_revenue: string;
    cogs: string;
    gross_profit: string;
    gross_margin_pct: string | null;
    operating_expenses: string;
    operating_profit: string;
    operating_margin_pct: string | null;
    net_profit: string;
    net_margin_pct: string | null;
  };
  treasury_and_liquidity: {
    operational_treasury_balance: string;
    cash_collected: string;
    outstanding_receivables: string;
    outstanding_payables: string;
  };
  inventory: {
    total_stock_units: number;
    in_stock_products_count: number;
    low_stock_products_count: number;
    out_of_stock_products_count: number;
    fifo_valuation: string;
  };
  customers: {
    total_customers: number;
    new_customers: number;
    active_buyers: number;
  };
  procurement: {
    approved_po_value: string;
    total_billed_value: string;
  };
  alerts_summary: {
    critical_count: number;
    warning_count: number;
    top_alerts: Array<{
      id: number;
      public_id: string;
      severity: AlertSeverity;
      title: string;
      message: string;
      domain: string;
      created_at: string;
    }>;
  };
}

export interface SalesAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  currency_warning: string | null;
  data_freshness: string;
  generated_at: string;
  summary: {
    gross_sales: string;
    discount_total: string;
    tax_total: string;
    sales_returns_total: string;
    net_sales: string;
    invoice_count: number;
    pos_transaction_count: number;
    average_invoice_value: string;
  };
  comparative: {
    prior_period?: { start_date: string; end_date: string };
    prior_gross_sales?: string;
    prior_net_sales?: string;
    prior_invoice_count?: number;
    growth_gross_sales_pct?: string | null;
    growth_net_sales_pct?: string | null;
    growth_invoice_count_pct?: string | null;
  };
  lifecycle: Array<{
    status: string;
    count: number;
    total_amount: string;
  }>;
  channel_breakdown: Array<{
    channel: string;
    count: number;
    total_amount: string;
    percentage: number;
  }>;
  daily_trend: Array<{
    date: string;
    gross_sales: string;
    net_sales: string;
    invoice_count: number;
  }>;
  top_products: Array<{
    product_id: number;
    name: string;
    sku: string;
    units_sold: number;
    gross_amount: string;
    discount_amount: string;
  }>;
}

export interface ProductAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  currency_warning: string | null;
  data_freshness: string;
  generated_at: string;
  summary: {
    total_products_tracked: number;
    active_products_count: number;
    inactive_products_count: number;
    products_with_sales_in_period: number;
    products_without_sales_in_period: number;
  };
  top_products: Array<{
    product_id: number;
    name: string;
    sku: string;
    units_sold: number;
    total_revenue: string;
    total_discount: string;
    average_selling_price: string;
    invoice_count: number;
  }>;
  non_moving_products: Array<{
    product_id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    listed_price: string;
  }>;
}

export interface InventoryAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  data_freshness: string;
  generated_at: string;
  health_summary: {
    total_products_tracked: number;
    total_stock_units: number;
    in_stock_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    low_stock_threshold: number;
  };
  valuation: {
    fifo_valuation: string;
    active_cost_layers_count: number;
    unverified_stock_products_count: number;
    is_gl_reconciled: boolean;
    gl_inventory_balance: string;
    reconciliation_variance: string;
  };
  movements: {
    total_movement_events: number;
    inflow_units: number;
    outflow_units: number;
    breakdown: Array<{
      movement_type: string;
      event_count: number;
      quantity_delta: number;
      total_cost: string;
    }>;
  };
  expiry_radar: {
    expired_batches: number;
    expiring_within_30_days: number;
    expiring_within_60_days: number;
    expiring_within_90_days: number;
  };
  low_stock_products: Array<{
    product_id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    price: string;
  }>;
  out_of_stock_products: Array<{
    product_id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    price: string;
  }>;
}

export interface ProcurementAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  data_freshness: string;
  generated_at: string;
  purchase_orders: {
    total_count: number;
    total_value: string;
    approved_value: string;
    ordered_quantity: number;
    received_quantity: number;
    fulfillment_rate_pct: number;
    status_breakdown: Array<{
      status: string;
      count: number;
      total_amount: string;
    }>;
  };
  purchase_bills: {
    total_count: number;
    total_billed: string;
    total_landed_costs: string;
    posted_bills_value: string;
  };
  supplier_concentration: Array<{
    supplier_id: number;
    name: string;
    code: string;
    bill_count: number;
    total_spend: string;
    spend_percentage: number;
  }>;
}

export interface CustomerAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  data_freshness: string;
  generated_at: string;
  summary: {
    total_customers: number;
    new_customers_count: number;
    active_buyers_count: number;
    repeat_buyers_count: number;
    repeat_purchase_rate_pct: number;
  };
  segments: Array<{
    segment: string;
    count: number;
    total_receivables: string;
  }>;
  receivables: {
    total_outstanding: string;
    total_credit_limit: string;
    credit_approved_customers: number;
    suspended_customers: number;
  };
  top_customers: Array<{
    customer_id: number;
    name: string;
    phone: string;
    customer_type: string;
    invoice_count: number;
    total_spend: string;
  }>;
}

export interface TreasuryAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  data_freshness: string;
  generated_at: string;
  balances: {
    total_operational_balance: string;
    by_type: Array<{
      account_type: string;
      account_count: number;
      total_balance: string;
    }>;
    accounts: Array<{
      id: number;
      name: string;
      account_type: string;
      current_balance: string;
      currency: string;
    }>;
  };
  cash_movements: {
    inflows_total: string;
    inflows_count: number;
    outflows_total: string;
    outflows_count: number;
    net_cash_movement: string;
    inflow_sources: Array<{
      source_type: string;
      total: string;
      count: number;
    }>;
    outflow_sources: Array<{
      source_type: string;
      total: string;
      count: number;
    }>;
  };
  settlements: {
    pending_batches_count: number;
    pending_batches_amount: string;
  };
}

export interface ExpenseAnalyticsData {
  period: AnalyticsPeriod;
  currency: string;
  data_freshness: string;
  generated_at: string;
  summary: {
    total_vouchers: number;
    approved_amount: string;
    disbursed_amount: string;
    balance_due: string;
  };
  status_breakdown: Array<{
    status: string;
    count: number;
    amount: string;
  }>;
  category_breakdown: Array<{
    category_id: number;
    name: string;
    code: string;
    voucher_count: number;
    total_spend: string;
    percentage: number;
  }>;
  financing_isolation: {
    capital_contributions_total: string;
    owner_drawings_total: string;
    loan_principal_repaid: string;
    loan_interest_paid: string;
    is_isolated_from_operating_expenses: boolean;
    note: string;
  };
  profitability: {
    completeness_status: string;
    currency_warning: string | null;
    recognized_revenue: string;
    cogs: string;
    gross_profit: string;
    gross_margin_pct: string | null;
    operating_expenses: string;
    operating_profit: string;
    operating_margin_pct: string | null;
    net_profit: string;
    net_margin_pct: string | null;
  };
}

export interface TrendAnalyticsData {
  period: AnalyticsPeriod;
  prior_period: {
    start_date: string;
    end_date: string;
  };
  currency: string;
  data_freshness: string;
  generated_at: string;
  growth_metrics: {
    current_sales: string;
    prior_sales: string;
    sales_growth_pct: string | null;
    current_invoices: number;
    prior_invoices: number;
    invoice_growth_pct: string | null;
    current_expenses: string;
    prior_expenses: string;
    expense_growth_pct: string | null;
    new_customers: number;
    prior_new_customers: number;
    customer_growth_pct: string | null;
  };
  inventory_turnover: {
    status: string;
    turnover_ratio: string | null;
    days_sales_inventory: number | null;
  };
  monthly_trends: Array<{
    month_label: string;
    start_date: string;
    end_date: string;
    sales_amount: string;
    invoice_count: number;
  }>;
}

