import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { ReservationListItem, ReservationStatus } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { ExportButtons } from '../../../../shared/components/export-buttons/export-buttons';
import { ExportColumn } from '../../../../core/services/exporter';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ReservationsApi } from '../../services/reservations-api';

// GET /admin/reservations returns the whole list -> filtering and paging happen here.
@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, ExportButtons, RouterLink, DatePipe],
  selector: 'app-reservations-list',
  templateUrl: './reservations-list.html',
})
export class ReservationsList implements OnInit {
  private readonly api = inject(ReservationsApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly all = signal<ReservationListItem[]>([]);
  readonly loading = signal(true);
  readonly q = signal('');
  readonly status = signal<ReservationStatus | ''>('');
  readonly from = signal('');
  readonly to = signal('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly statuses: ReservationStatus[] = ['Upcoming', 'Active', 'Completed', 'Cancelled'];

  readonly counts = computed(() => {
    const c: Record<string, number> = { all: this.all().length };
    for (const r of this.all()) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  });

  readonly filtered = computed(() => {
    const q = this.q().toLowerCase();
    const st = this.status();
    const from = this.from() ? new Date(this.from()).getTime() : null;
    const to = this.to() ? new Date(this.to() + 'T23:59:59').getTime() : null;
    return this.all()
      .filter((r) => !st || r.status === st)
      .filter(
        (r) =>
          !q ||
          r.reference_no.toLowerCase().includes(q) ||
          r.guest_name.toLowerCase().includes(q) ||
          r.guest_phone.includes(q) ||
          (r.room_number ?? '').toLowerCase().includes(q),
      )
      .filter((r) => (from === null || new Date(r.check_in).getTime() >= from) && (to === null || new Date(r.check_in).getTime() <= to))
      .sort((a, b) => b.check_in.localeCompare(a.check_in));
  });

  readonly paged = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  readonly exportColumns: ExportColumn<ReservationListItem>[] = [
    { label: 'Reference', value: (r) => r.reference_no },
    { label: 'Guest', value: (r) => r.guest_name },
    { label: 'Phone', value: (r) => r.guest_phone },
    { label: 'Room', value: (r) => r.room_number },
    { label: 'Check-in', value: (r) => r.check_in, type: 'date' },
    { label: 'Check-out', value: (r) => r.check_out, type: 'date' },
    { label: 'Guests', value: (r) => r.guests_count, type: 'number' },
    { label: 'Status', value: (r) => r.status },
  ];
  readonly loadAll = async () => this.filtered();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(s: ReservationStatus | ''): void {
    this.status.set(s);
    this.page.set(1);
  }

  setSearch(q: string): void {
    this.q.set(q);
    this.page.set(1);
  }

  setDate(which: 'from' | 'to', v: string): void {
    (which === 'from' ? this.from : this.to).set(v);
    this.page.set(1);
  }

  async cancel(r: ReservationListItem): Promise<void> {
    const reason = await this.confirm.askReason({
      title: `Cancel ${r.reference_no}?`,
      message: `${r.guest_name} · room ${r.room_number ?? '—'}. The stay is cancelled automatically.`,
      danger: true,
      confirmText: 'Cancel reservation',
      cancelText: 'Keep',
      reason: { label: 'Reason', required: true, maxLength: 300 },
    });
    if (!reason) return;
    this.api.cancel(r.id, reason).subscribe(() => {
      this.toast.success('Reservation cancelled.');
      this.load();
    });
  }

  async remove(r: ReservationListItem): Promise<void> {
    const ok = await this.confirm.ask({ title: `Delete ${r.reference_no}?`, message: 'The reservation will be removed from the lists.', danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.api.delete(r.id).subscribe(() => {
      this.toast.success('Reservation deleted.');
      this.load();
    });
  }
}
