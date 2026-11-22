import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { LocationListItem, Reservation, ReservationRequest, Room, UnitType } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { isoToLocalInput, localInputToIso } from '../../../../core/utils/format';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { ReservationsApi } from '../../services/reservations-api';

function datesOrder(group: AbstractControl): ValidationErrors | null {
  const a = group.get('check_in')?.value;
  const b = group.get('check_out')?.value;
  return a && b && new Date(b) <= new Date(a) ? { dates: true } : null;
}

@Component({
  imports: [ReactiveFormsModule, PageHeader, Loading, StatusBadge, DatePipe, RouterLink],
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.html',
})
export class ReservationForm implements OnInit {
  private readonly api = inject(ReservationsApi);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  readonly id = input<string>();
  readonly reservationId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isNew = computed(() => this.reservationId() === null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly details = signal<Reservation | null>(null);
  readonly warnings = signal<string[]>([]);
  readonly locations = signal<LocationListItem[]>([]);
  readonly unitTypes = signal<UnitType[]>([]);
  readonly rooms = signal<Room[]>([]);
  readonly locationId = signal<number | null>(null);

  readonly locked = computed(() => {
    const d = this.details();
    return !!d && (d.status === 'Cancelled' || d.status === 'Completed');
  });
  readonly canSave = computed(
    () => !this.locked() && this.auth.hasPermission(this.isNew() ? P.reservations.create : P.reservations.edit),
  );
  readonly unitTypeName = computed(() => {
    const map = new Map(this.unitTypes().map((u) => [u.id, u]));
    return (id: number) => map.get(id);
  });
  readonly nights = computed(() => {
    const v = this.formValue();
    if (!v.check_in || !v.check_out) return 0;
    const diff = new Date(v.check_out).getTime() - new Date(v.check_in).getTime();
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
  });

  readonly form = inject(FormBuilder).group(
    {
      room_id: [null as number | null, Validators.required],
      guest_name: ['', [Validators.required, Validators.maxLength(100)]],
      guest_phone: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^\+?[0-9\s-]{7,20}$/)]],
      check_in: ['', Validators.required],
      check_out: ['', Validators.required],
      guests_count: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
      notes: ['', Validators.maxLength(500)],
    },
    { validators: datesOrder },
  );
  private readonly formValue = signal(this.form.getRawValue());

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.formValue.set(this.form.getRawValue()));
    this.catalog.allLocations().subscribe((res) => this.locations.set(res.data));
    this.catalog.unitTypes({ page: 1, page_size: 100 }).subscribe((res) => this.unitTypes.set(res.data));

    const id = this.reservationId();
    if (id) {
      this.loading.set(true);
      this.api.get(id).subscribe({
        next: (r) => {
          this.details.set(r);
          this.form.patchValue({ ...r, check_in: isoToLocalInput(r.check_in), check_out: isoToLocalInput(r.check_out) });
          this.formValue.set(this.form.getRawValue());
          // load the room to know its location
          this.catalog.room(r.room_id).subscribe((room) => this.setLocation(room.location_id, false));
          if (!this.canSave()) this.form.disable();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      // default: today 14:00 -> tomorrow 12:00
      const a = new Date();
      a.setHours(14, 0, 0, 0);
      const b = new Date(a.getTime() + 86_400_000);
      b.setHours(12, 0, 0, 0);
      this.form.patchValue({ check_in: isoToLocalInput(a.toISOString()), check_out: isoToLocalInput(b.toISOString()) });
      if (!this.canSave()) this.form.disable();
    }
  }

  setLocation(id: number | null, resetRoom = true): void {
    this.locationId.set(id);
    if (resetRoom) this.form.controls.room_id.setValue(null);
    if (!id) {
      this.rooms.set([]);
      return;
    }
    this.catalog.rooms({ location_id: id, page: 1, page_size: 100 }).subscribe((res) => this.rooms.set(res.data));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning(this.form.hasError('dates') ? 'Check-out must be after check-in.' : 'Please complete the required fields.');
      return;
    }
    const v = this.form.getRawValue();
    const dto: ReservationRequest = {
      room_id: Number(v.room_id),
      guest_name: v.guest_name!.trim(),
      guest_phone: v.guest_phone!.replace(/\s|-/g, ''),
      check_in: localInputToIso(v.check_in)!,
      check_out: localInputToIso(v.check_out)!,
      guests_count: Number(v.guests_count),
      notes: v.notes || null,
    };

    this.saving.set(true);
    const id = this.reservationId();
    const done = (r: Reservation, msg: string) => {
      this.saving.set(false);
      this.warnings.set(r.warnings ?? []);
      this.toast.success(msg);
      (r.warnings ?? []).forEach((w) => this.toast.warning(w));
    };

    if (id) {
      dto.version = this.details()!.version;
      this.api.update(id, dto).subscribe({
        next: (r) => {
          this.details.set(r);
          done(r, 'Reservation saved.');
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.api.create(dto).subscribe({
        next: (r) => {
          done(r, `Reservation ${r.reference_no} created.`);
          void this.router.navigate(['/reservations', r.id]);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  async cancelReservation(): Promise<void> {
    const r = this.details();
    if (!r) return;
    const reason = await this.confirm.askReason({
      title: `Cancel ${r.reference_no}?`,
      message: 'The stay of this reservation is cancelled automatically.',
      danger: true,
      confirmText: 'Cancel reservation',
      cancelText: 'Keep',
      reason: { label: 'Reason', required: true, maxLength: 300 },
    });
    if (!reason) return;
    this.api.cancel(r.id, reason).subscribe(() => {
      this.toast.success('Reservation cancelled.');
      this.api.get(r.id).subscribe((x) => {
        this.details.set(x);
        this.form.disable();
      });
    });
  }
}
