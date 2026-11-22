import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { AdminCustomerListItem, ExportFormat, UsersSummary } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { saveBlob } from '../../../../core/utils/format';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ReportsApi } from '../../../reports/services/reports-api';
import { CustomersApi } from '../../services/customers-api';

// AdminCustomersController: list / summary / block-unblock.  Export to Excel = ReportsController (reports.export).
@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, StatCard, RouterLink, DatePipe],
  selector: 'app-customers-list',
  templateUrl: './customers-list.html',
})
export class CustomersList implements OnInit {
  private readonly api = inject(CustomersApi);
  private readonly reports = inject(ReportsApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly canEdit = computed(() => this.auth.hasPermission(P.customers.edit));
  readonly canExport = computed(() => this.auth.hasPermission(P.reports.export));

  readonly rows = signal<AdminCustomerListItem[]>([]);
  readonly summary = signal<UsersSummary | null>(null);
  readonly loading = signal(true);
  readonly exporting = signal<ExportFormat | null>(null);
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

  export(format: ExportFormat): void {
    this.exporting.set(format);
    this.reports.export('customers', { search: this.search() || null, status: this.status() || null }, format).subscribe({
      next: ({ blob, fileName }) => {
        saveBlob(blob, fileName);
        this.exporting.set(null);
      },
      error: () => this.exporting.set(null),
    });
  }
}
