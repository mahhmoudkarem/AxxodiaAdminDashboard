import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  GUEST_PAYMENT_STATUSES,
  GUEST_REQUEST_STATUSES,
  GUEST_SERVICE_TYPES,
  GuestServiceRequestDetails,
  LocationListItem,
} from '../../../../core/models';
import { map } from 'rxjs';
import { ExportColumn, Exporter } from '../../../../core/services/exporter';
import { dateInputToIso, humanize } from '../../../../core/utils/format';
import { ExportButtons } from '../../../../shared/components/export-buttons/export-buttons';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { GuestServicesApi } from '../../services/guest-services-api';
import { SERVICE_ICONS } from '../services-list/services-list';

// Admin monitoring of all guest-service requests of all locations (read only; staff process them in the app).
@Component({
  imports: [PageHeader, DataTable, StatusBadge, Modal, SearchInput, ExportButtons, HumanizePipe, DatePipe, DecimalPipe, RouterLink],
  selector: 'app-service-requests-list',
  templateUrl: './requests-list.html',
})
export class ServiceRequestsList implements OnInit {
  private readonly api = inject(GuestServicesApi);
  private readonly catalog = inject(CatalogApi);
  private readonly exporter = inject(Exporter);
  readonly statuses = GUEST_REQUEST_STATUSES;
  readonly paymentStatuses = GUEST_PAYMENT_STATUSES;
  readonly types = GUEST_SERVICE_TYPES;
  readonly icons = SERVICE_ICONS;

  readonly rows = signal<GuestServiceRequestDetails[]>([]);
  readonly locations = signal<LocationListItem[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly selected = signal<GuestServiceRequestDetails | null>(null);

  readonly filters = signal({
    q: '',
    status: '',
    payment_status: '',
    service_type: '',
    location_id: '',
    overdue_only: false,
    date_from: '',
    date_to: '',
  });

  readonly exportColumns: ExportColumn<GuestServiceRequestDetails>[] = [
    { label: '#', value: (r) => r.id, type: 'number' },
    { label: 'Service', value: (r) => r.service_name },
    { label: 'Type', value: (r) => humanize(r.service_type) },
    { label: 'Guest', value: (r) => r.customer_name },
    { label: 'Phone', value: (r) => r.customer_phone },
    { label: 'Room', value: (r) => r.room_number },
    { label: 'Location', value: (r) => r.location_name },
    { label: 'Employee', value: (r) => r.assigned_staff_name },
    { label: 'Status', value: (r) => humanize(r.status) },
    { label: 'Payment', value: (r) => humanize(r.payment_status) },
    { label: 'Method', value: (r) => r.payment_method },
    { label: 'Total', value: (r) => r.total_amount, type: 'money' },
    { label: 'Created', value: (r) => r.created_at, type: 'date' },
    { label: 'Completed', value: (r) => r.completed_at, type: 'date' },
  ];
  readonly loadAll = () =>
    this.exporter.fetchAll((page, pageSize) =>
      this.api.requests({ ...this.queryParams(), page, page_size: pageSize }).pipe(map((r) => ({ data: r.data, total: r.meta.total }))),
    );

  ngOnInit(): void {
    this.catalog.allLocations().subscribe({ next: (res) => this.locations.set(res.data), error: () => {} });
    this.load();
  }

  set(key: string, value: string | boolean): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.page.set(1);
    this.load();
  }

  // current filters as API query
  private queryParams() {
    const f = this.filters();
    return {
      q: f.q || null,
      status: f.status || null,
      payment_status: f.payment_status || null,
      service_type: f.service_type || null,
      location_id: f.location_id || null,
      overdue_only: f.overdue_only || null,
      date_from: dateInputToIso(f.date_from),
      date_to: dateInputToIso(f.date_to, true),
    };
  }

  load(): void {
    this.loading.set(true);
    this.api
      .requests({ ...this.queryParams(), page: this.page(), page_size: this.pageSize })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  open(r: GuestServiceRequestDetails): void {
    this.selected.set(r);
    this.api.request(r.id).subscribe((d) => this.selected.set(d));
  }

  overdue(r: GuestServiceRequestDetails): boolean {
    return !!r.due_at && !r.completed_at && !r.cancelled_at && !r.rejected_at && new Date(r.due_at).getTime() < Date.now();
  }
}
