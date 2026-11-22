// Axxodia.Shared/Dtos/Notifications  (/staff/me/notifications)

export const NOTIFICATION_CATEGORIES = [
  'Reservation',
  'Stay',
  'Chat',
  'Housekeeping',
  'Maintenance',
  'GuestServices',
  'Offers',
  'System',
] as const;

export interface AppNotification {
  id: number;
  category: string;
  title: string;
  body: string;
  data_json?: string | null;
  deep_link?: string | null;
  source_module?: string | null;
  source_entity_id?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationPreference {
  category: string;
  is_enabled: boolean;
}
