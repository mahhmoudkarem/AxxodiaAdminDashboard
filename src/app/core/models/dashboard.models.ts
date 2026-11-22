// GET /admin/dashboard/summary

export interface DashboardSummary {
  generated_at: string;
  location_id?: number | null;
  staff: {
    active_staff: number;
    working_now: number;
    customer_service: number;
    housekeeping: number;
    maintenance: number;
  };
  stays: {
    checked_in: number;
    check_ins_today: number;
    check_outs_today: number;
    upcoming_reservations: number;
  };
  housekeeping: TaskSummary;
  maintenance: TaskSummary;
  chat: {
    unassigned: number;
    assigned: number;
  };
  active_offers: number;
}

export interface TaskSummary {
  waiting_for_customer_service: number;
  assigned: number;
  in_progress: number;
  pending_completion: number;
  completed_today: number;
}
