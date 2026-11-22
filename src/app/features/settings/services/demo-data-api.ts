import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';

// AdminDemoDataController  ->  /admin/demo-data   (super admin only)
@Service()
export class DemoDataApi {
  private readonly api = inject(Api);

  create() {
    return this.api.post<{ message: string }>('admin/demo-data');
  }
  remove() {
    return this.api.delete<{ message: string }>('admin/demo-data');
  }
}
