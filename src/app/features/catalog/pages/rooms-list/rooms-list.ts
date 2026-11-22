import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { BulkCreateRoomsResult, LocationListItem, Room, UnitType, WifiSecret } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { CatalogApi } from '../../services/catalog-api';

@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, RouterLink, Modal, ReactiveFormsModule],
  selector: 'app-rooms-list',
  templateUrl: './rooms-list.html',
})
export class RoomsList implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly location = input<string>(); // ?location=
  readonly unitType = input<string>(); // ?unitType=

  readonly rows = signal<Room[]>([]);
  readonly locations = signal<LocationListItem[]>([]);
  readonly unitTypes = signal<UnitType[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly q = signal('');
  readonly locationId = signal<number | null>(null);
  readonly unitTypeId = signal<number | null>(null);
  readonly status = signal('');

  readonly wifi = signal<(WifiSecret & { room: string }) | null>(null);

  // ---------- Bulk create: POST /admin/rooms/bulk (numbers from..to, max 200) ----------
  readonly bulkOpen = signal(false);
  readonly bulkSaving = signal(false);
  readonly bulkResult = signal<BulkCreateRoomsResult | null>(null);
  readonly bulkLocation = signal<number | null>(null);
  readonly bulkUnitTypes = computed(() => this.unitTypes().filter((u) => u.location_id === this.bulkLocation()));
  readonly bulkForm = inject(FormBuilder).group({
    location_id: [null as number | null, Validators.required],
    unit_type_id: [null as number | null, Validators.required],
    prefix: ['', Validators.maxLength(5)],
    from: [101 as number | null, [Validators.required, Validators.min(0), Validators.max(9999)]],
    to: [110 as number | null, [Validators.required, Validators.min(0), Validators.max(9999)]],
    floor: ['', Validators.maxLength(20)],
  });
  private readonly bulkValue = signal(this.bulkForm.getRawValue());
  readonly bulkPreview = computed(() => {
    const v = this.bulkValue();
    const from = Number(v.from);
    const to = Number(v.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) return { count: 0, sample: '' };
    const p = (v.prefix ?? '').trim();
    const count = to - from + 1;
    return { count, sample: count === 1 ? `${p}${from}` : `${p}${from}, ${p}${from + 1}${count > 2 ? ' … ' + p + to : ''}` };
  });

  readonly locationName = computed(() => {
    const map = new Map(this.locations().map((l) => [l.id, l.name_en]));
    return (id: number) => map.get(id) ?? `#${id}`;
  });
  readonly unitTypeName = computed(() => {
    const map = new Map(this.unitTypes().map((u) => [u.id, u.name_en]));
    return (id: number) => map.get(id) ?? `#${id}`;
  });
  readonly filteredUnitTypes = computed(() =>
    this.locationId() ? this.unitTypes().filter((u) => u.location_id === this.locationId()) : this.unitTypes(),
  );

  ngOnInit(): void {
    this.bulkForm.valueChanges.subscribe(() => this.bulkValue.set(this.bulkForm.getRawValue()));
    this.bulkForm.controls.location_id.valueChanges.subscribe((v) => {
      this.bulkLocation.set(v ?? null);
      this.bulkForm.controls.unit_type_id.setValue(null);
    });
    if (this.location()) this.locationId.set(Number(this.location()));
    if (this.unitType()) this.unitTypeId.set(Number(this.unitType()));
    this.api.allLocations().subscribe((res) => this.locations.set(res.data));
    this.api.unitTypes({ page: 1, page_size: 100 }).subscribe((res) => this.unitTypes.set(res.data));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .rooms({
        page: this.page(),
        page_size: this.pageSize,
        q: this.q() || undefined,
        location_id: this.locationId(),
        unit_type_id: this.unitTypeId(),
        status: this.status() || null,
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  search(q: string): void {
    this.q.set(q);
    this.page.set(1);
    this.load();
  }

  setLocation(v: string): void {
    this.locationId.set(v ? Number(v) : null);
    this.unitTypeId.set(null);
    this.page.set(1);
    this.load();
  }

  setUnitType(v: string): void {
    this.unitTypeId.set(v ? Number(v) : null);
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

  openBulk(): void {
    this.bulkResult.set(null);
    this.bulkForm.reset({ location_id: this.locationId(), unit_type_id: null, prefix: '', from: 101, to: 110, floor: '' });
    if (this.unitTypeId()) this.bulkForm.controls.unit_type_id.setValue(this.unitTypeId());
    this.bulkOpen.set(true);
  }

  saveBulk(): void {
    const v = this.bulkForm.getRawValue();
    const preview = this.bulkPreview();
    if (this.bulkForm.invalid || preview.count === 0) {
      this.bulkForm.markAllAsTouched();
      this.toast.warning(preview.count === 0 ? '"To" must be greater than or equal to "From".' : 'Please complete the required fields.');
      return;
    }
    if (preview.count > 200) {
      this.toast.warning('You can create at most 200 rooms at once.');
      return;
    }
    this.bulkSaving.set(true);
    this.api
      .bulkCreateRooms({
        location_id: Number(v.location_id),
        unit_type_id: Number(v.unit_type_id),
        from: Number(v.from),
        to: Number(v.to),
        prefix: v.prefix?.trim() || null,
        floor: v.floor?.trim() || null,
      })
      .subscribe({
        next: (res) => {
          this.bulkSaving.set(false);
          this.bulkResult.set(res);
          this.toast.success(`${res.created} room(s) created.`);
          this.load();
        },
        error: () => this.bulkSaving.set(false),
      });
  }

  showWifi(room: Room): void {
    this.api.roomWifi(room.id).subscribe((w) => this.wifi.set({ ...w, room: room.room_number }));
  }

  copy(text: string | null | undefined): void {
    if (!text) return;
    void navigator.clipboard?.writeText(text).then(() => this.toast.success('Copied.'));
  }

  async remove(row: Room): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete room ${row.room_number}?`,
      message: 'Rooms with reservations cannot be deleted. Set them "Out of service" instead.',
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.deleteRoom(row.id).subscribe(() => {
      this.toast.success('Room deleted.');
      this.load();
    });
  }
}
