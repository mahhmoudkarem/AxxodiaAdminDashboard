import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { GUEST_SERVICE_TYPES, GuestService, GuestServiceRequest, GuestServiceType, InternetPackage } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { GuestServicesApi } from '../../services/guest-services-api';

export const SERVICE_ICONS: Record<GuestServiceType, string> = {
  Wifi: 'fa-wifi',
  AirportTransportation: 'fa-plane-arrival',
  InternetRecharge: 'fa-sim-card',
  ElectricityRecharge: 'fa-bolt',
};

@Component({
  imports: [PageHeader, DataTable, StatusBadge, Modal, ReactiveFormsModule, HumanizePipe, DecimalPipe],
  selector: 'app-guest-services-list',
  templateUrl: './services-list.html',
})
export class GuestServicesList implements OnInit {
  private readonly api = inject(GuestServicesApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  private readonly fb = inject(FormBuilder);
  readonly types = GUEST_SERVICE_TYPES;
  readonly icons = SERVICE_ICONS;

  readonly rows = signal<GuestService[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly typeFilter = signal<GuestServiceType | ''>('');

  readonly editing = signal<GuestService | 'new' | null>(null);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    type: ['Wifi' as GuestServiceType, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(1000)],
    additional_fee_percentage: [0, [Validators.min(0), Validators.max(100)]],
    is_active: [true],
  });

  // Internet packages (InternetRecharge services)
  readonly packagesOf = signal<GuestService | null>(null);
  readonly packages = signal<InternetPackage[]>([]);
  readonly packageEditing = signal<InternetPackage | 'new' | null>(null);
  readonly packageForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    recharge_value: [0, [Validators.required, Validators.min(0.01)]],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.services({ page: this.page(), page_size: this.pageSize, service_type: this.typeFilter() || null }).subscribe({
      next: (res) => {
        this.rows.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setType(v: string): void {
    this.typeFilter.set(v as GuestServiceType | '');
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  open(row: GuestService | 'new'): void {
    this.form.reset({ type: 'Wifi', name: '', description: '', additional_fee_percentage: 0, is_active: true });
    if (row === 'new') this.form.controls.type.enable();
    else {
      this.form.patchValue({ ...row, description: row.description ?? '' });
      this.form.controls.type.disable();
    }
    this.editing.set(row);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: GuestServiceRequest = {
      name: v.name.trim(),
      description: v.description || null,
      additional_fee_percentage: Number(v.additional_fee_percentage),
      is_active: v.is_active,
    };
    const current = this.editing();
    this.saving.set(true);
    const req = current && current !== 'new' ? this.api.update(current.id, dto) : this.api.create({ ...dto, type: v.type });
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toast.success('Service saved.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  toggle(row: GuestService): void {
    this.api.setActive(row.id, !row.is_active).subscribe(() => {
      this.rows.update((list) => list.map((x) => (x.id === row.id ? { ...x, is_active: !row.is_active } : x)));
      this.toast.success(row.is_active ? 'Service turned off.' : 'Service turned on.');
    });
  }

  async remove(row: GuestService): Promise<void> {
    const ok = await this.confirm.ask({ title: `Delete ${row.name}?`, message: 'Services that already have requests should be turned off instead.', danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.api.delete(row.id).subscribe(() => {
      this.toast.success('Service deleted.');
      this.load();
    });
  }

  // ---------- packages ----------
  openPackages(row: GuestService): void {
    this.packagesOf.set(row);
    this.packageEditing.set(null);
    this.loadPackages();
  }

  loadPackages(): void {
    const s = this.packagesOf();
    if (s) this.api.packages(s.id).subscribe((list) => this.packages.set(list));
  }

  editPackage(p: InternetPackage | 'new'): void {
    this.packageForm.reset({ name: '', recharge_value: 0, is_active: true });
    if (p !== 'new') this.packageForm.patchValue(p);
    this.packageEditing.set(p);
  }

  savePackage(): void {
    const s = this.packagesOf();
    if (!s || this.packageForm.invalid) {
      this.packageForm.markAllAsTouched();
      return;
    }
    const v = this.packageForm.getRawValue();
    const dto = { name: v.name.trim(), recharge_value: Number(v.recharge_value), is_active: v.is_active };
    const current = this.packageEditing();
    const req: Observable<unknown> = current && current !== 'new' ? this.api.updatePackage(current.id, dto) : this.api.createPackage(s.id, dto);
    req.subscribe(() => {
      this.toast.success('Package saved.');
      this.packageEditing.set(null);
      this.loadPackages();
    });
  }

  togglePackage(p: InternetPackage): void {
    this.api.setPackageActive(p.id, !p.is_active).subscribe(() => this.loadPackages());
  }

  async removePackage(p: InternetPackage): Promise<void> {
    const ok = await this.confirm.ask({ title: `Delete ${p.name}?`, danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.api.deletePackage(p.id).subscribe(() => this.loadPackages());
  }
}
