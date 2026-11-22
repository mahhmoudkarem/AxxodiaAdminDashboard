import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { AdminCustomerDetails, Customer360 } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ReportsApi } from '../../../reports/services/reports-api';
import { CustomersApi } from '../../services/customers-api';

// Customer page: GET /admin/customers/{id} (+ block / unblock).
// With reports.view the full history (/admin/reports/customers/{id}/360) is shown under it.
@Component({
  imports: [PageHeader, Loading, StatusBadge, DatePipe, DecimalPipe, RouterLink],
  selector: 'app-customer-360',
  templateUrl: './customer-360.html',
})
export class Customer360Page implements OnInit {
  private readonly api = inject(CustomersApi);
  private readonly reports = inject(ReportsApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly canEdit = computed(() => this.auth.hasPermission(P.customers.edit));

  readonly id = input.required<string>();
  readonly customer = signal<AdminCustomerDetails | null>(null);
  readonly history = signal<Customer360 | null>(null);
  readonly loading = signal(true);
  readonly tab = signal<'stays' | 'services' | 'payments' | 'offers' | 'housekeeping'>('stays');

  ngOnInit(): void {
    this.load();
    if (this.auth.hasPermission(P.reports.view)) {
      this.reports.customer360(Number(this.id())).subscribe({ next: (d) => this.history.set(d), error: () => {} });
    }
  }

  load(): void {
    this.api.get(Number(this.id())).subscribe({
      next: (c) => {
        this.customer.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  async toggleBlock(): Promise<void> {
    const c = this.customer();
    if (!c) return;
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
      },
      error: () => {},
    });
  }
}
