// Housekeeping types + maintenance tasks (Axxodia.Shared/Dtos/Tasks)

export type TaskStatus = 'New' | 'Assigned' | 'InProgress' | 'PendingCompletion' | 'Completed' | 'Cancelled';
export const TASK_STATUSES: TaskStatus[] = ['New', 'Assigned', 'InProgress', 'PendingCompletion', 'Completed', 'Cancelled'];

export interface HousekeepingType {
  id: number;
  name_ar: string;
  name_en: string;
  icon?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface HousekeepingTypeRequest {
  name_ar: string;
  name_en: string;
  icon?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface TaskImage {
  id: number;
  task_id: number;
  type: 'Before' | 'After' | string;
  status: string;
  content_type: string;
  size_bytes: number;
  width: number;
  height: number;
  uploaded_at: string;
  expires_at: string;
  uploaded_by_staff_id: number;
  content_url?: string | null;
  thumbnail_url?: string | null;
}

export interface TaskEvent {
  id: number;
  task_id: number;
  type: string;
  from_status?: string | null;
  to_status?: string | null;
  by_staff_id?: number | null;
  by_staff_name?: string | null;
  note?: string | null;
  at: string;
}

// GET /admin/maintenance/tasks/{id}
export interface MaintenanceTask {
  id: number;
  task_type: string;
  room_number: string;
  description: string;
  status: TaskStatus | string;
  created_at: string;
  location_id: number;
  location_name_ar: string;
  location_name_en: string;
  room_id: number;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  assigned_by_staff_id?: number | null;
  assigned_by_staff_name?: string | null;
  duration_seconds?: number | null;
  assigned_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  notes?: string | null;
  cancel_reason?: string | null;
  images: TaskImage[];
  events: TaskEvent[];
}

export interface UpdateMaintenanceTaskRequest {
  room_id: number;
  description: string;
}
