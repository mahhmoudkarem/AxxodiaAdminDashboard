import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { AdminCustomerListItem, UsersSummary } from '../../../../core/models';
import { ExportColumn, Exporter } from '../../../../core/services/exporter';
import { map } from 'rxjs';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { ExportButtons } from '../../../../shared/components/export-buttons/export-buttons';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { CustomersApi } from '../../services/customers-api';

// AdminCustomersController: list / summary / block-unblock. Excel / PDF are built in the browser.
@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, StatCard, ExportButtons, RouterLink, DatePipe],
  selector: 'app-customers-list',
  templateUrl: './customers-list.html',
})
export class CustomersList implements OnInit {
  private readonly api = inject(CustomersApi);
  private readonly exporter = inject(Exporter);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly canEdit = computed(() => this.auth.hasPermission(P.customers.edit));
  readonly canExport = computed(() => this.auth.hasPermission(P.customers.export, P.reports.export));

  readonly rows = signal<AdminCustomerListItem[]>([]);
  readonly summary = signal<UsersSummary | null>(null);
  readonly loading = signal(true);

  readonly exportColumns: ExportColumn<AdminCustomerListItem>[] = [
    { label: 'ID', value: (c) => c.id, type: 'number' },
    { label: 'Name', value: (c) => c.full_name },
    { label: 'Phone', value: (c) => c.phone },
    { label: 'Email', value: (c) => c.email },
    { label: 'Country', value: (c) => c.country },
    { label: 'Language', value: (c) => c.language },
    { label: 'Status', value: (c) => (c.status === 'Disabled' ? 'Blocked' : c.status) },
    { label: 'Reservations', value: (c) => c.reservations, type: 'number' },
    { label: 'In house', value: (c) => c.checked_in_now },
    { label: 'Joined', value: (c) => c.created_at, type: 'date' },
    { label: 'Last active', value: (c) => c.last_active_at, type: 'date' },
  ];
  // every page with the current filters
  readonly loadAll = () =>
    this.exporter.fetchAll((page, pageSize) =>
      this.api
        .list({ search: this.search() || null, status: this.status() || null, page, pageSize })
        .pipe(map((r) => ({ data: r.data, total: r.meta.total }))),
    );
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly search = signal('');
  readonly status = signal('');

  ngOnInit(): void {
    this.api.summary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ search: this.search() || null, status: this.status() || null, page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (res) => {
        this.rows.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setSearch(v: string): void {
    this.search.set(v);
    this.page.set(1);
    this.load();
  }

  setStatus(v: string): void {
    this.status.set(v);
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  async toggleBlock(c: AdminCustomerListItem): Promise<void> {
    const block = c.status === 'Active';
    const ok = await this.confirm.ask({
      title: block ? `Block ${c.full_name}?` : `Unblock ${c.full_name}?`,
      message: block ? 'The customer is signed out of the app right away and cannot sign in again.' : 'The customer can use the app again.',
      danger: block,
      confirmText: block ? 'Block' : 'Unblock',
    });
    if (!ok) return;
    this.api.setStatus(c.id, block ? 'Disabled' : 'Active').subscribe({
      next: () => {
        this.toast.success(block ? 'Customer blocked.' : 'Customer unblocked.');
        this.load();
        this.api.summary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
      },
      error: () => {},
    });
  }
}
