import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { Amenity, LocationListItem, UnitType, UnitTypeRequest } from '../../../../core/models';
import { Toast } from '../../../../core/services/toast';
import { ImageManager } from '../../../../shared/components/image-manager/image-manager';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { AmenityPicker } from '../../components/amenity-picker/amenity-picker';
import { CatalogApi } from '../../services/catalog-api';

@Component({
  imports: [ReactiveFormsModule, PageHeader, Loading, AmenityPicker, ImageManager],
  selector: 'app-unit-type-form',
  templateUrl: './unit-type-form.html',
})
export class UnitTypeForm implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  readonly id = input<string>();
  readonly location = input<string>(); // ?location= preselect on /new
  readonly unitTypeId = computed(() => (this.id() ? Number(this.id()) : null));
  readonly isNew = computed(() => this.unitTypeId() === null);
  readonly canSave = computed(() => this.auth.hasPermission(this.isNew() ? P.unitTypes.create : P.unitTypes.edit));

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly locations = signal<LocationListItem[]>([]);
  readonly amenities = signal<Amenity[]>([]);
  readonly amenityIds = signal<number[]>([]);
  // fixed list from the API: active ones + any inactive one already linked
  readonly pickable = computed(() => this.amenities().filter((a) => a.is_active || this.amenityIds().includes(a.id)));
  readonly details = signal<UnitType | null>(null);

  readonly form = inject(FormBuilder).group({
    location_id: [null as number | null, Validators.required],
    name_en: ['', [Validators.required, Validators.maxLength(120)]],
    name_ar: ['', [Validators.required, Validators.maxLength(120)]],
    bedrooms: [1, [Validators.required, Validators.min(0), Validators.max(255)]],
    bathrooms: [1, [Validators.required, Validators.min(0), Validators.max(99.9)]],
    area_sqm: [null as number | null, [Validators.min(0), Validators.max(99999.99)]],
    max_guests: [2, [Validators.required, Validators.min(1), Validators.max(255)]],
    description_en: ['', Validators.maxLength(4000)],
    description_ar: ['', Validators.maxLength(4000)],
    is_active: [true],
  });

  ngOnInit(): void {
    this.api.allLocations().subscribe((res) => this.locations.set(res.data));
    this.api.amenities().subscribe((list) => this.amenities.set(list));
    if (!this.canSave()) this.form.disable();

    const id = this.unitTypeId();
    if (id) {
      this.form.controls.location_id.disable(); // the location of a unit type cannot change
      this.loading.set(true);
      this.api.unitType(id).subscribe({
        next: (u) => {
          this.details.set(u);
          this.form.patchValue(u);
          this.amenityIds.set(u.amenities.map((a) => a.id));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else if (this.location()) {
      this.form.patchValue({ location_id: Number(this.location()) });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please complete the required fields.');
      return;
    }
    const v = this.form.getRawValue();
    const dto: UnitTypeRequest = {
      name_en: v.name_en!.trim(),
      name_ar: v.name_ar!.trim(),
      bedrooms: Number(v.bedrooms),
      bathrooms: Number(v.bathrooms),
      area_sqm: v.area_sqm === null || (v.area_sqm as unknown) === '' ? null : Number(v.area_sqm),
      max_guests: Number(v.max_guests),
      description_en: v.description_en || null,
      description_ar: v.description_ar || null,
      amenity_ids: this.amenityIds(),
      is_active: !!v.is_active,
    };

    this.saving.set(true);
    const id = this.unitTypeId();
    if (id) {
      dto.version = this.details()!.version;
      this.api.updateUnitType(id, dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Unit type saved.');
          this.api.unitType(id).subscribe((u) => this.details.set(u));
        },
        error: () => this.saving.set(false),
      });
    } else {
      dto.location_id = Number(v.location_id);
      this.api.createUnitType(dto).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Unit type created. You can add photos now.');
          void this.router.navigate(['/catalog/unit-types', res.id]);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
