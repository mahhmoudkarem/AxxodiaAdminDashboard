import { inject, Service } from '@angular/core';
import { Api } from '../../../core/services/api';
import { MaintenanceTask, UpdateMaintenanceTaskRequest } from '../../../core/models';

// AdminMaintenanceTasksController  ->  /admin/maintenance/tasks
// (the list comes from ReportsController: /admin/reports/maintenance)
@Service()
export class MaintenanceApi {
  private readonly api = inject(Api);

  get(id: number) {
    return this.api.get<MaintenanceTask>(`admin/maintenance/tasks/${id}`);
  }
  update(id: number, dto: UpdateMaintenanceTaskRequest) {
    return this.api.put<void>(`admin/maintenance/tasks/${id}`, dto);
  }
  delete(id: number) {
    return this.api.delete(`admin/maintenance/tasks/${id}`);
  }
  start(id: number) {
    return this.api.post<void>(`admin/maintenance/tasks/${id}/start`);
  }
  end(id: number) {
    return this.api.post<void>(`admin/maintenance/tasks/${id}/end`);
  }
}
