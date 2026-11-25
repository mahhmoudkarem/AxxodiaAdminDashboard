import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { StayDetails, StayListItem } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { ExportButtons } from '../../../../shared/components/export-buttons/export-buttons';
import { ExportColumn } from '../../../../core/services/exporter';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { ReservationsApi } from '../../services/reservations-api';

// StaysController: a stay follows the reservation dates automatically; the admin can only view / cancel it.
@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, Modal, ExportButtons, DatePipe, RouterLink],
  selector: 'app-stays-list',
  templateUrl: './stays-list.html',
})
export class StaysList implements OnInit {
  private readonly api = inject(ReservationsApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly all = signal<StayListItem[]>([]);
  readonly loading = signal(true);
  readonly q = signal('');
  readonly status = signal('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly selected = signal<StayDetails | null>(null);
  readonly statuses = ['CheckedIn', 'CheckedOut', 'Cancelled'];

  readonly counts = computed(() => {
    const c: Record<string, number> = { all: this.all().length };
    for (const s of this.all()) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  });

  readonly filtered = computed(() => {
    const q = this.q().toLowerCase();
    return this.all()
      .filter((s) => !this.status() || s.status === this.status())
      .filter(
        (s) =>
          !q ||
          s.reference_no.toLowerCase().includes(q) ||
          s.guest_name.toLowerCase().includes(q) ||
          s.guest_phone.includes(q) ||
          s.room_number.toLowerCase().includes(q),
      )
      .sort((a, b) => b.check_in.localeCompare(a.check_in));
  });
  readonly paged = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  readonly exportColumns: ExportColumn<StayListItem>[] = [
    { label: 'Guest', value: (s) => s.guest_name },
    { label: 'Phone', value: (s) => s.guest_phone },
    { label: 'Room', value: (s) => s.room_number },
    { label: 'Reservation', value: (s) => s.reference_no },
    { label: 'Check-in', value: (s) => s.check_in, type: 'date' },
    { label: 'Check-out', value: (s) => s.check_out, type: 'date' },
    { label: 'Checked in at', value: (s) => s.checked_in_at, type: 'date' },
    { label: 'Checked out at', value: (s) => s.checked_out_at, type: 'date' },
    { label: 'Status', value: (s) => s.status },
  ];
  readonly loadAll = async () => this.filtered();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.stays().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(s: string): void {
    this.status.set(s);
    this.page.set(1);
  }

  setSearch(q: string): void {
    this.q.set(q);
    this.page.set(1);
  }

  open(s: StayListItem): void {
    this.api.stay(s.id).subscribe((d) => this.selected.set(d));
  }

  async cancel(s: StayListItem | StayDetails): Promise<void> {
    const reason = await this.confirm.askReason({
      title: `Cancel the stay of ${s.guest_name}?`,
      message: `Room ${s.room_number} · ${s.reference_no}`,
      danger: true,
      confirmText: 'Cancel stay',
      cancelText: 'Keep',
      reason: { label: 'Reason', required: true, maxLength: 500 },
    });
    if (!reason) return;
    this.api.cancelStay(s.id, reason).subscribe(() => {
      this.toast.success('Stay cancelled.');
      this.selected.set(null);
      this.load();
    });
  }
}
