export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface OrderItemDetail {
  id: number;
  product_public_id: string | null;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface OrderStatusHistoryItem {
  from_status: string;
  to_status: string;
  reason: string;
  created_at: string;
}

export interface AdminOrderListItem {
  public_id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  item_count: number;
  total: string;
  currency: string;
  created_at: string;
}

export interface AdminOrderDetail {
  public_id: string;
  order_number: string;
  customer: {
    public_id: string;
    email: string;
    full_name: string;
    phone: string;
  };
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: string;
  subtotal: string;
  shipping_cost: string;
  discount_total: string;
  total: string;
  shipping_address: {
    full_name: string;
    phone: string;
    address: string;
    address_line2?: string;
    city: string;
    area?: string;
    postal_code?: string;
    country: string;
  };
  customer_notes: string;
  items: OrderItemDetail[];
  status_history: OrderStatusHistoryItem[];
  payment?: PaymentSummary | null;
  payment_attempts?: PaymentAttemptItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentSummary {
  public_id: string;
  gateway: string;
  method: string;
  status: string;
  amount: string;
  currency: string;
  provider_transaction_id: string;
  provider_reference: string;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentAttemptItem {
  public_id: string;
  attempt_number: number;
  gateway: string;
  status: string;
  amount: string;
  currency: string;
  provider_transaction_id?: string;
  error_message?: string;
  created_at: string;
}

export interface PaginatedAdminOrders {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminOrderListItem[];
}

export interface AdminOrderListParams {
  page?: number;
  status?: string;
  payment_status?: string;
  search?: string;
}
