export type NotificationDeliveryStatus = "pending" | "sent" | "failed";

export interface AdminNotification {
  public_id: string;
  event_type: string;
  channel: "email" | "sms";
  status: NotificationDeliveryStatus;
  recipient: string;
  subject: string;
  attempt_count: number;
  provider_message_id?: string | null;
  error_message?: string | null;
  order_public_id?: string | null;
  return_public_id?: string | null;
  refund_public_id?: string | null;
  created_at: string;
  sent_at?: string | null;
  failed_at?: string | null;
}

export interface PaginatedAdminNotifications {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminNotification[];
}

export interface NotificationFilters {
  status?: string;
  event_type?: string;
  recipient?: string;
  page?: number;
}
