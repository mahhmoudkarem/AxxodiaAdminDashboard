import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CreatedId, HousekeepingType, HousekeepingTypeRequest } from '../../../core/models';

// AdminHousekeepingTypesController  ->  /admin/housekeeping-types
// (the housekeeping TASKS list for the web comes from ReportsController: /admin/reports/housekeeping)
@Service()
export class HousekeepingApi {
  private readonly api = inject(Api);

  types(isActive?: boolean | null) {
    return this.api.get<HousekeepingType[]>('admin/housekeeping-types', { is_active: isActive });
  }
  create(dto: HousekeepingTypeRequest) {
    return this.api.post<CreatedId>('admin/housekeeping-types', dto);
  }
  update(id: number, dto: HousekeepingTypeRequest) {
    return this.api.put<void>(`admin/housekeeping-types/${id}`, dto);
  }
  delete(id: number) {
    return this.api.delete(`admin/housekeeping-types/${id}`);
  }
}
