import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CreateStaffRequest, PagedResult, ResetStaffPasswordRequest, StaffMember, StaffRole, UpdateStaffRequest } from '../../../core/models';

export interface StaffQuery {
  page?: number;
  page_size?: number;
  role?: string | null;
  location_id?: number | null;
  is_active?: boolean | null;
  presence?: string | null;
  working?: boolean | null;
  search?: string | null;
}

// AdminStaffController  ->  /admin/staff
@Service()
export class StaffApi {
  private readonly api = inject(Api);

  list(q: StaffQuery = {}) {
    return this.api.get<PagedResult<StaffMember>>('admin/staff', { ...q });
  }
  roles() {
    return this.api.get<StaffRole[]>('admin/staff/roles');
  }
  get(id: number) {
    return this.api.get<StaffMember>(`admin/staff/${id}`);
  }
  create(dto: CreateStaffRequest) {
    return this.api.post<StaffMember>('admin/staff', dto);
  }
  update(id: number, dto: UpdateStaffRequest) {
    return this.api.put<StaffMember>(`admin/staff/${id}`, dto);
  }
  setActive(id: number, active: boolean) {
    return this.api.post<void>(`admin/staff/${id}/${active ? 'activate' : 'deactivate'}`);
  }
  resetPassword(id: number, dto: ResetStaffPasswordRequest) {
    return this.api.post<void>(`admin/staff/${id}/reset-password`, dto);
  }
}
