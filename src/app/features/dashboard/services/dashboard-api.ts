import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { DashboardSummary } from '../../../core/models';

// AdminDashboardController  ->  /admin/dashboard
@Service()
export class DashboardApi {
  private readonly api = inject(Api);

  summary(locationId?: number | null) {
    return this.api.get<DashboardSummary>('admin/dashboard/summary', { location_id: locationId });
  }
}
