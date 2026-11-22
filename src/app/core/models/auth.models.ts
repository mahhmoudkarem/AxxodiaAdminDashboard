// Axxodia.Shared/Dtos/Authentication

// POST /auth/login  (one sign-in for customers and staff; the dashboard only accepts staff)
export interface LoginRequest {
  identifier: string; // email (staff) or phone (customers)
  password: string;
}

export interface StaffInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
  app_profile?: string | null;
  client_access?: string | null;
  must_change_password: boolean;
  permissions: string[];
}

// LoginResultDto of POST /auth/login  (X-App: admin -> refresh token is in an HttpOnly cookie, never in the body)
export interface LoginResult {
  kind: 'customer' | 'staff' | string;
  role: string; // customer | housekeeping | maintenance | customer_service | cs_supervisor | admin | super_admin
  app_profile?: string | null;
  access_token: string;
  refresh_token?: string | null;
  expires_in: number;
  must_change_password: boolean;
  staff?: StaffInfo | null;
}

// POST /auth/refresh
export interface TokenPair {
  access_token: string;
  refresh_token?: string | null;
  expires_in: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
