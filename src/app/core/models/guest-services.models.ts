// Axxodia.Shared/Dtos/GuestServices (enums are sent as names)

export type GuestServiceType = 'Wifi' | 'AirportTransportation' | 'InternetRecharge' | 'ElectricityRecharge';
export type GuestServicePaymentPolicy = 'Free' | 'CashOnly' | 'CustomerChoice';
export type GuestServiceRequestStatus =
  | 'Pending'
  | 'AwaitingCustomerApproval'
  | 'AwaitingPayment'
  | 'Accepted'
  | 'InProgress'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';
export type GuestServicePaymentStatus = 'NotRequired' | 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export const GUEST_SERVICE_TYPES: GuestServiceType[] = ['Wifi', 'AirportTransportation', 'InternetRecharge', 'ElectricityRecharge'];
export const GUEST_REQUEST_STATUSES: GuestServiceRequestStatus[] = [
  'Pending',
  'AwaitingCustomerApproval',
  'AwaitingPayment',
  'Accepted',
  'InProgress',
  'Completed',
  'Rejected',
  'Cancelled',
];
export const GUEST_PAYMENT_STATUSES: GuestServicePaymentStatus[] = ['NotRequired', 'Pending', 'Paid', 'Failed', 'Refunded'];

export interface GuestService {
  id: number;
  type: GuestServiceType;
  name: string;
  description?: string | null;
  payment_policy: GuestServicePaymentPolicy;
  additional_fee_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface InternetPackage {
  id: number;
  guest_service_id: number;
  name: string;
  recharge_value: number;
  is_active: boolean;
  created_at: string;
}

export interface GuestServiceDetails extends GuestService {
  internet_packages: InternetPackage[];
  updated_at?: string | null;
}

export interface GuestServiceRequest {
  type?: GuestServiceType; // create only
  name: string;
  description?: string | null;
  additional_fee_percentage: number;
  is_active: boolean;
}

export interface InternetPackageRequest {
  name: string;
  recharge_value: number;
  is_active: boolean;
}

export interface GuestServicePayment {
  id: number;
  method: 'Cash' | 'Online';
  status: GuestServicePaymentStatus;
  amount: number;
  provider_name?: string | null;
  transaction_reference?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  refunded_at?: string | null;
}

export interface GuestServiceRequestEvent {
  id: number;
  event_type: string;
  actor_type: string;
  actor_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface GuestServiceRequestDetails {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  stay_id: number;
  room_id: number;
  room_number: string;
  location_id?: number | null;
  location_name?: string | null;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  service_type: GuestServiceType;
  service_name: string;
  status: GuestServiceRequestStatus;
  payment_method?: 'Cash' | 'Online' | null;
  payment_status: GuestServicePaymentStatus;
  base_amount: number;
  additional_fee_percentage: number;
  additional_fee_amount: number;
  total_amount: number;
  quoted_amount?: number | null;
  quoted_at?: string | null;
  customer_responded_to_quote_at?: string | null;
  customer_accepted_quote?: boolean | null;
  created_at: string;
  accepted_at?: string | null;
  due_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  rejected_at?: string | null;
  cancelled_at?: string | null;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  airport_name?: string | null;
  flight_time?: string | null;
  internet_package_name?: string | null;
  recharge_value?: number | null;
  electricity_recharge_amount?: number | null;
  payments: GuestServicePayment[];
  events: GuestServiceRequestEvent[];
}
