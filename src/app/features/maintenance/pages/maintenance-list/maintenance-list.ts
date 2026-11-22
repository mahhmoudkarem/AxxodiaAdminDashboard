import { Component, inject } from '@angular/core';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { TaskReport } from '../../../reports/components/task-report/task-report';

@Component({
  imports: [PageHeader, TaskReport, EmptyState],
  selector: 'app-maintenance-list',
  template: `
    <app-page-header title="Maintenance" subtitle="Repair tasks reported by guests and staff — open a task to correct, start or end it" icon="fa-screwdriver-wrench" />
    @if (auth.hasPermission(P.reports.view)) {
      <app-task-report kind="maintenance" detailsLink="/maintenance" />
    } @else {
      <div class="card"><app-empty-state title="No access to the task list" message="The list needs the reports.view permission." /></div>
    }
  `,
})
export class MaintenanceList {
  readonly auth = inject(Auth);
  readonly P = P;
}
