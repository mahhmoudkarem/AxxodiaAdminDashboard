import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { LocationListItem, ReportQuery, Room, TASK_STATUSES, TaskReportRow } from '../../../../core/models';
import { map } from 'rxjs';
import { ExportColumn, Exporter } from '../../../../core/services/exporter';
import { dateInputToIso, formatDuration } from '../../../../core/utils/format';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { ExportButtons } from '../../../../shared/components/export-buttons/export-buttons';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { ReportsApi } from '../../services/reports-api';

// Housekeeping / maintenance tasks list for the web dashboard.
// The API has no admin list endpoint for tasks, so it uses /admin/reports/housekeeping | maintenance.
@Component({
  selector: 'app-task-report',
  imports: [DataTable, StatusBadge, ExportButtons, HumanizePipe, DatePipe, RouterLink],
  templateUrl: './task-report.html',
})
export class TaskReport implements OnInit {
  private readonly reports = inject(ReportsApi);
  private readonly catalog = inject(CatalogApi);
  private readonly exporter = inject(Exporter);
  readonly auth = inject(Auth);

  readonly kind = input.required<'housekeeping' | 'maintenance'>();
  // maintenance rows open /maintenance/:id
  readonly detailsLink = input<string | null>(null);

  readonly statuses = TASK_STATUSES;
  readonly rows = signal<TaskReportRow[]>([]);
  readonly summary = signal<Record<string, number>>({});
  readonly locations = signal<LocationListItem[]>([]);
  readonly rooms = signal<Room[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly filters = signal({ status: '', locationId: '', from: '', to: '' });

  readonly canExport = computed(() => this.auth.hasPermission(P.reports.export));
  readonly locationName = computed(() => {
    const m = new Map(this.locations().map((l) => [l.id, l.name_en]));
    return (id: number) => m.get(id) ?? `#${id}`;
  });
  readonly roomNumber = computed(() => {
    const m = new Map(this.rooms().map((r) => [r.id, r.room_number]));
    return (id: number) => m.get(id) ?? `#${id}`;
  });
  readonly exportTitle = computed(() => (this.kind() === 'housekeeping' ? 'Housekeeping tasks' : 'Maintenance tasks'));
  readonly exportColumns: ExportColumn<TaskReportRow>[] = [
    { label: 'Task', value: (r) => `#${r.task_id}` },
    { label: 'Location', value: (r) => this.locationName()(r.location_id) },
    { label: 'Room', value: (r) => this.roomNumber()(r.room_id) },
    { label: 'Employee', value: (r) => r.assigned_staff_name },
    { label: 'Status', value: (r) => r.status },
    { label: 'Started', value: (r) => r.started_at, type: 'date' },
    { label: 'Completed', value: (r) => r.completed_at, type: 'date' },
    { label: 'Duration', value: (r) => (r.duration_seconds == null ? '' : formatDuration(r.duration_seconds)) },
  ];
  readonly loadAll = () =>
    this.exporter.fetchAll((page, pageSize) =>
      this.reports.get<TaskReportRow>(this.kind(), { ...this.query(), page, pageSize }).pipe(map((r) => ({ data: r.data, total: r.meta?.total_count ?? r.data.length }))),
    );
  readonly summaryEntries = computed(() => Object.entries(this.summary()).slice(0, 6));
  readonly duration = formatDuration;

  ngOnInit(): void {
    this.catalog.allLocations().subscribe({ next: (r) => this.locations.set(r.data), error: () => {} });
    this.catalog.rooms({ page: 1, page_size: 100 }).subscribe({ next: (r) => this.rooms.set(r.data), error: () => {} });
    this.load();
  }

  private query(): ReportQuery {
    const f = this.filters();
    return {
      status: f.status || null,
      locationId: f.locationId ? Number(f.locationId) : null,
      from: dateInputToIso(f.from),
      to: dateInputToIso(f.to, true),
      page: this.page(),
      pageSize: this.pageSize,
    };
  }

  load(): void {
    this.loading.set(true);
    this.reports.get<TaskReportRow>(this.kind(), this.query()).subscribe({
      next: (res) => {
        this.rows.set(res.data);
        this.summary.set(res.summary ?? {});
        this.total.set(res.meta?.total_count ?? res.data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  set(key: string, value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

}
