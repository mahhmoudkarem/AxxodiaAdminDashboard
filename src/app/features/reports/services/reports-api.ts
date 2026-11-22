import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Customer360, ExportFormat, QueryParams, ReportKey, ReportQuery, ReportResponse } from '../../../core/models';

// ReportsController  ->  /admin/reports
@Service()
export class ReportsApi {
  private readonly api = inject(Api);

  get<T = Record<string, unknown>>(name: ReportKey, query: ReportQuery = {}) {
    return this.api.get<ReportResponse<T>>(`admin/reports/${name}`, query as QueryParams);
  }

  customer360(customerId: number) {
    return this.api.get<Customer360>(`admin/reports/customers/${customerId}/360`);
  }

  // Needs reports.export. Returns the file + the name sent by the API.
  export(name: ReportKey, query: ReportQuery, format: ExportFormat) {
    const { page, pageSize, ...filters } = query;
    return this.api.download(`admin/reports/${name}/export`, { ...(filters as QueryParams), format }).pipe(
      map((res) => {
        const disposition = res.headers.get('Content-Disposition') ?? '';
        const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
        const fileName = match ? decodeURIComponent(match[1]) : `${name}-${new Date().toISOString().slice(0, 10)}.${format}`;
        return { blob: res.body as Blob, fileName };
      }),
    );
  }
}
