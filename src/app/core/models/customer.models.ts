// Axxodia.Shared/Dtos/Customers  (/admin/customers)

export type CustomerStatus = 'Active' | 'Disabled';

export interface AdminCustomerListItem {
  id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  country?: string | null;
  language: string;
  status: CustomerStatus | string;
  created_at: string;
  last_active_at?: string | null;
  reservations: number;
  checked_in_now: boolean;
  open_conversations: number;
  open_tasks: number;
}

export interface AdminCustomerReservation {
  id: number;
  reference_no: string;
  location: string;
  room_number: string;
  check_in: string;
  check_out: string;
  status: string;
}

export interface AdminCustomerDetails extends AdminCustomerListItem {
  address?: string | null;
  phone_verified: boolean;
  social_providers: string[];
  guest_service_requests: number;
  maintenance_requests: number;
  conversations: number;
  recent_reservations: AdminCustomerReservation[];
}

export interface UsersSummary {
  customers: number;
  active_customers: number;
  disabled_customers: number;
  new_customers_last7_days: number;
  checked_in_now: number;
  active_staff: number;
  staff_working_now: number;
}

export interface BulkCreateRoomsRequest {
  location_id: number;
  unit_type_id: number;
  from: number;
  to: number;
  prefix?: string | null;
  floor?: string | null;
}

export interface BulkCreateRoomsResult {
  created: number;
  skipped: string[];
}
