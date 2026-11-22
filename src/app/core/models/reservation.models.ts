// Axxodia.Shared/Dtos/Reservation + StayDtos

export type ReservationStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export interface ReservationListItem {
  id: number;
  reference_no: string;
  guest_name: string;
  guest_phone: string;
  room_number?: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  status: ReservationStatus;
}

export interface Reservation extends ReservationListItem {
  room_id: number;
  notes?: string | null;
  linked_customer_id?: number | null;
  created_at: string;
  cancel_reason?: string | null;
  version: number;
  warnings: string[];
}

export interface ReservationRequest {
  room_id: number;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  notes?: string | null;
  version?: number; // update only
}

export type StayStatus = 'CheckedIn' | 'CheckedOut' | 'Cancelled';

export interface StayListItem {
  id: number;
  reservation_id: number;
  reference_no: string;
  guest_name: string;
  guest_phone: string;
  room_number: string;
  status: StayStatus | string;
  check_in: string;
  check_out: string;
  checked_in_at: string;
  checked_out_at?: string | null;
  cancelled_at?: string | null;
}

export interface StayDetails extends StayListItem {
  room_id: number;
  cancelled_by_staff_name?: string | null;
  cancel_reason?: string | null;
}
