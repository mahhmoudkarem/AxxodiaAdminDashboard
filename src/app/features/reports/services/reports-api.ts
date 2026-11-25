import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Customer360, QueryParams, ReportKey, ReportQuery, ReportResponse } from '../../../core/models';

// ReportsController  ->  /admin/reports   (Excel / PDF are built in the browser, see Exporter)
@Service()
export class ReportsApi {
  private readonly api = inject(Api);

  get<T = Record<string, unknown>>(name: ReportKey, query: ReportQuery = {}) {
    return this.api.get<ReportResponse<T>>(`admin/reports/${name}`, query as QueryParams);
  }

  customer360(customerId: number) {
    return this.api.get<Customer360>(`admin/reports/customers/${customerId}/360`);
  }

}
