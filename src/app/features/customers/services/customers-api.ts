import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { AdminCustomerDetails, AdminCustomerListItem, CustomerStatus, PagedResult, UsersSummary } from '../../../core/models';

// AdminCustomersController  ->  /admin/customers
// AdminCustomersQuery has no [FromQuery(Name)], so the page size is sent as "pageSize".
@Service()
export class CustomersApi {
  private readonly api = inject(Api);

  list(q: { search?: string | null; status?: string | null; page?: number; pageSize?: number } = {}) {
    return this.api.get<PagedResult<AdminCustomerListItem>>('admin/customers', q);
  }
  summary() {
    return this.api.get<UsersSummary>('admin/customers/summary');
  }
  get(id: number) {
    return this.api.get<AdminCustomerDetails>(`admin/customers/${id}`);
  }
  setStatus(id: number, status: CustomerStatus) {
    return this.api.patch<void>(`admin/customers/${id}/status`, { status });
  }
}
