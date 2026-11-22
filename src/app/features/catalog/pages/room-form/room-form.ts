import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { LocationListItem, Room, RoomRequest, UnitType } from '../../../../core/models';
import { Toast } from '../../../../core/services/toast';
import { ImageManager } from '../../../../shared/components/image-manager/image-manager';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { CatalogApi } from '../../services/catalog-api';

@Component({
  imports: [ReactiveFormsModule, PageHeader, Loading, ImageManager],
  selector: 'app-room-form',
  templateUrl: './room-form.html',
})
export class RoomForm implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  readonly id = input<string>();
  readonly location = input<string>();
  readonly unitType = input<string>();
  readonly roomId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isNew = computed(() => this.roomId() === null);
  readonly canSave = computed(() => this.auth.hasPermission(this.isNew() ? P.rooms.create : P.rooms.edit));
  readonly canEditWifi = computed(() => this.auth.hasPermission(P.rooms.wifiEdit));

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly locations = signal<LocationListItem[]>([]);
  readonly unitTypes = signal<UnitType[]>([]);
  readonly details = signal<Room | null>(null);
  readonly selectedLocation = signal<number | null>(null);
  readonly locationUnitTypes = computed(() => this.unitTypes().filter((u) => u.location_id === this.selectedLocation()));

  readonly form = inject(FormBuilder).group({
    location_id: [null as number | null, Validators.required],
    unit_type_id: [null as number | null, Validators.required],
    room_number: ['', [Validators.required, Validators.maxLength(10)]],
    floor: ['', Validators.maxLength(20)],
    status: ['Available'],
    notes: ['', Validators.maxLength(500)],
    wifi_name: ['', Validators.maxLength(60)],
    wifi_password: ['', Validators.maxLength(63)],
    clear_wifi_password: [false],
  });

  ngOnInit(): void {
    this.api.allLocations().subscribe((res) => this.locations.set(res.data));
    this.api.unitTypes({ page: 1, page_size: 100 }).subscribe((res) => this.unitTypes.set(res.data));
    this.form.controls.location_id.valueChanges.subscribe((v) => {
      this.selectedLocation.set(v ?? null);
      if (this.isNew()) this.form.controls.unit_type_id.setValue(null);
    });

    if (!this.canSave()) this.form.disable();
    if (!this.canEditWifi()) {
      this.form.controls.wifi_name.disable();
      this.form.controls.wifi_password.disable();
      this.form.controls.clear_wifi_password.disable();
    }

    const id = this.roomId();
    if (id) {
      this.form.controls.location_id.disable();
      this.form.controls.unit_type_id.disable();
      this.loading.set(true);
      this.api.room(id).subscribe({
        next: (r) => {
          this.details.set(r);
          this.selectedLocation.set(r.location_id);
          this.form.patchValue({ ...r, wifi_password: '' }, { emitEvent: false });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      const loc = this.location() ? Number(this.location()) : null;
      if (loc) {
        this.form.controls.location_id.setValue(loc);
        if (this.unitType()) this.form.controls.unit_type_id.setValue(Number(this.unitType()));
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please complete the required fields.');
      return;
    }
    const v = this.form.getRawValue();
    const dto: RoomRequest = {
      room_number: v.room_number!.trim(),
      floor: v.floor || null,
      notes: v.notes || null,
      // Wi-Fi: null = keep as it is, "" = clear (needs rooms.wifi.edit)
      wifi_name: this.canEditWifi() ? (v.wifi_name ?? '') : null,
      wifi_password: this.canEditWifi() ? (v.clear_wifi_password ? '' : v.wifi_password || null) : null,
    };

    this.saving.set(true);
    const id = this.roomId();
    if (id) {
      dto.status = v.status ?? 'Available';
      dto.version = this.details()!.version;
      this.api.updateRoom(id, dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Room saved.');
          this.api.room(id).subscribe((r) => {
            this.details.set(r);
            this.form.patchValue({ wifi_password: '', clear_wifi_password: false }, { emitEvent: false });
          });
        },
        error: () => this.saving.set(false),
      });
    } else {
      dto.location_id = Number(v.location_id);
      dto.unit_type_id = Number(v.unit_type_id);
      if (!this.canEditWifi()) {
        delete dto.wifi_name;
        delete dto.wifi_password;
      }
      this.api.createRoom(dto).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Room created.');
          void this.router.navigate(['/catalog/rooms', res.id]);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
