// Axxodia.Shared/Dtos/Staff

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  location_id?: number | null;
  location_name_ar?: string | null;
  location_name_en?: string | null;
  presence: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at?: string | null;
  open_tasks: number;
  created_at: string;
}

export interface StaffRole {
  role: string;
  requires_location: boolean;
}

export interface CreateStaffRequest {
  email: string;
  password: string;
  role: string;
  location_id?: number | null;
  name?: string | null;
  must_change_password: boolean;
}

export interface UpdateStaffRequest {
  name: string;
  role: string;
  location_id?: number | null;
}

export interface ResetStaffPasswordRequest {
  new_password: string;
  must_change_password: boolean;
}
