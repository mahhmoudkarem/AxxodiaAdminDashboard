// Axxodia.Shared/Reports  (/admin/reports/...)

export type ReportKey =
  | 'customers'
  | 'reservations'
  | 'housekeeping'
  | 'maintenance'
  | 'employees'
  | 'paid-services'
  | 'payments'
  | 'offers';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

// ReportQuery has no [FromQuery(Name)] so the query keys are the C# property names (case-insensitive).
export interface ReportQuery {
  from?: string | null;
  to?: string | null;
  country?: string | null;
  employeeId?: number | null;
  role?: string | null;
  locationId?: number | null;
  roomId?: number | null;
  status?: string | null;
  serviceCode?: string | null;
  arrivalFrom?: string | null;
  arrivalTo?: string | null;
  search?: string | null;
  sort?: string | null;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ReportChartSeries {
  name: string;
  labels: string[];
  values: number[];
}

export interface ReportResponse<T> {
  summary: Record<string, number>;
  chart: ReportChartSeries[];
  data: T[];
  meta: { page: number; page_size: number; total_count: number };
}

export interface CustomerReportRow {
  customer_id: number;
  full_name: string;
  phone: string;
  country?: string | null;
  status: string;
  created_at: string;
  reservations_count: number;
  stays_count: number;
}

export interface TaskReportRow {
  task_id: number;
  location_id: number;
  room_id: number;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
}

export interface Customer360 {
  profile: {
    customer_id: number;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone: string;
    country?: string | null;
    address?: string | null;
    language: string;
    status: string;
    created_at: string;
    last_active_at?: string | null;
  };
  reservations: {
    id: number;
    reference_no: string;
    room_id: number;
    room_number?: string | null;
    location_name?: string | null;
    check_in: string;
    check_out: string;
    status: string;
  }[];
  stays: { id: number; reservation_id: number; status: string; checked_in_at: string; checked_out_at?: string | null }[];
  guest_services: {
    id: number;
    service_name: string;
    status: string;
    total_amount: number;
    created_at: string;
    completed_at?: string | null;
  }[];
  payments: {
    id: number;
    guest_service_request_id: number;
    status: string;
    amount: number;
    paid_at?: string | null;
    refunded_at?: string | null;
  }[];
  offers: { offer_id: number; title: string; start_date: string; end_date: string; is_active: boolean }[];
  housekeeping: { id: number; room_id: number; status: string; started_at?: string | null; completed_at?: string | null }[];
}
