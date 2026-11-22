import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { Amenity, LocationDetails, LocationRequest, StaffMember } from '../../../../core/models';
import { Toast } from '../../../../core/services/toast';
import { emptyToNull } from '../../../../core/utils/format';
import { ImageManager } from '../../../../shared/components/image-manager/image-manager';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StaffApi } from '../../../staff/services/staff-api';
import { AmenityPicker } from '../../components/amenity-picker/amenity-picker';
import { CatalogApi } from '../../services/catalog-api';

@Component({
  imports: [ReactiveFormsModule, PageHeader, Loading, AmenityPicker, ImageManager],
  selector: 'app-location-form',
  templateUrl: './location-form.html',
})
export class LocationForm implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly staffApi = inject(StaffApi);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  readonly id = input<string>(); // route param (undefined on /new)
  readonly locationId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isNew = computed(() => this.locationId() === null);
  readonly canSave = computed(() => this.auth.hasPermission(this.isNew() ? P.locations.create : P.locations.edit));

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly amenities = signal<Amenity[]>([]);
  readonly amenityIds = signal<number[]>([]);
  // fixed list from the API: active ones + any inactive one already linked
  readonly pickable = computed(() => this.amenities().filter((a) => a.is_active || this.amenityIds().includes(a.id)));
  readonly csStaff = signal<StaffMember[]>([]);
  readonly details = signal<LocationDetails | null>(null);

  readonly form = inject(FormBuilder).group({
    name_en: ['', [Validators.required, Validators.maxLength(120)]],
    name_ar: ['', [Validators.required, Validators.maxLength(120)]],
    area_en: ['', Validators.maxLength(120)],
    area_ar: ['', Validators.maxLength(120)],
    address_en: ['', Validators.maxLength(250)],
    address_ar: ['', Validators.maxLength(250)],
    description_en: ['', Validators.maxLength(4000)],
    description_ar: ['', Validators.maxLength(4000)],
    stay_instructions_en: ['', Validators.maxLength(4000)],
    stay_instructions_ar: ['', Validators.maxLength(4000)],
    phone: ['', Validators.maxLength(20)],
    lat: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    lng: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    customer_service_staff_id: [null as number | null],
    sort_order: [0],
    is_active: [true],
  });

  ngOnInit(): void {
    this.api.amenities().subscribe((list) => this.amenities.set(list));
    if (!this.canSave()) this.form.disable();

    const id = this.locationId();
    if (id) {
      this.loading.set(true);
      this.api.location(id).subscribe({
        next: (l) => {
          this.details.set(l);
          this.form.patchValue(l);
          this.amenityIds.set(l.amenities.map((a) => a.id));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      // One customer-service employee answers the chats of this location.
      this.staffApi.list({ role: 'customer_service', location_id: id, is_active: true, page_size: 100 }).subscribe({
        next: (res) => this.csStaff.set(res.data),
        error: () => this.csStaff.set([]),
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please complete the required fields.');
      return;
    }
    const v = this.form.getRawValue();
    const dto: LocationRequest = {
      ...emptyToNull(v as Record<string, unknown>),
      name_en: v.name_en!.trim(),
      name_ar: v.name_ar!.trim(),
      amenity_ids: this.amenityIds(),
      is_active: !!v.is_active,
      sort_order: Number(v.sort_order ?? 0),
    } as LocationRequest;

    this.saving.set(true);
    const id = this.locationId();
    if (id) {
      dto.version = this.details()!.version;
      this.api.updateLocation(id, dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Location saved.');
          this.api.location(id).subscribe((l) => this.details.set(l));
        },
        error: () => this.saving.set(false),
      });
    } else {
      delete dto.customer_service_staff_id;
      this.api.createLocation(dto).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Location created. You can add photos now.');
          void this.router.navigate(['/catalog/locations', res.id]);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
