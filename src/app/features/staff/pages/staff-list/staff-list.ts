import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { LocationListItem, StaffMember, StaffRole } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { humanize } from '../../../../core/utils/format';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { STRONG_PASSWORD } from '../../../auth/pages/change-password/change-password';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { StaffApi } from '../../services/staff-api';

// AdminStaffController: list / details for admins, create / edit / activate / reset password need staff.manage.
@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, Modal, ReactiveFormsModule, HumanizePipe, DatePipe],
  selector: 'app-staff-list',
  templateUrl: './staff-list.html',
})
export class StaffList implements OnInit {
  private readonly api = inject(StaffApi);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(Auth);
  readonly canManage = computed(() => this.auth.hasPermission(P.staff.manage));

  readonly rows = signal<StaffMember[]>([]);
  readonly roles = signal<StaffRole[]>([]);
  readonly locations = signal<LocationListItem[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly filters = signal({ search: '', role: '', location_id: '', is_active: '', working: false });

  // create / edit
  readonly editing = signal<StaffMember | 'new' | null>(null);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.pattern(STRONG_PASSWORD)]],
    role: ['', Validators.required],
    location_id: [null as number | null],
    must_change_password: [true],
  });
  readonly selectedRole = signal('');
  readonly requiresLocation = computed(() => this.roles().find((r) => r.role === this.selectedRole())?.requires_location ?? false);

  // reset password
  readonly resetFor = signal<StaffMember | null>(null);
  readonly resetForm = this.fb.nonNullable.group({
    new_password: ['', [Validators.required, Validators.pattern(STRONG_PASSWORD)]],
    must_change_password: [true],
  });

  ngOnInit(): void {
    this.api.roles().subscribe((r) => this.roles.set(r));
    this.catalog.allLocations().subscribe({ next: (res) => this.locations.set(res.data), error: () => {} });
    this.form.controls.role.valueChanges.subscribe((r) => {
      this.selectedRole.set(r);
      const loc = this.form.controls.location_id;
      if (this.requiresLocation()) {
        loc.setValidators(Validators.required);
        loc.enable({ emitEvent: false });
      } else {
        loc.clearValidators();
        loc.setValue(null);
        loc.disable({ emitEvent: false });
      }
      loc.updateValueAndValidity({ emitEvent: false });
    });
    this.load();
  }

  load(): void {
    const f = this.filters();
    this.loading.set(true);
    this.api
      .list({
        page: this.page(),
        page_size: this.pageSize,
        search: f.search || null,
        role: f.role || null,
        location_id: f.location_id ? Number(f.location_id) : null,
        is_active: f.is_active === '' ? null : f.is_active === 'true',
        working: f.working || null,
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

  set(key: string, value: string | boolean): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  roleLabel(r: string | null | undefined): string {
    return humanize(r);
  }

  open(s: StaffMember | 'new'): void {
    this.form.reset({ name: '', email: '', password: '', role: '', location_id: null, must_change_password: true });
    if (s === 'new') {
      this.form.controls.email.enable();
      this.form.controls.password.enable();
      this.form.controls.must_change_password.enable();
      this.form.controls.name.clearValidators();
    } else {
      this.form.patchValue({ name: s.name, email: s.email, role: s.role ?? '', location_id: s.location_id ?? null });
      this.form.controls.email.disable();
      this.form.controls.password.disable();
      this.form.controls.must_change_password.disable();
      this.form.controls.name.setValidators([Validators.required, Validators.maxLength(100)]);
    }
    this.form.controls.name.updateValueAndValidity();
    this.selectedRole.set(this.form.controls.role.value);
    if (this.requiresLocation()) this.form.controls.location_id.enable({ emitEvent: false });
    else this.form.controls.location_id.disable({ emitEvent: false });
    this.editing.set(s);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const cur = this.editing();
    const location_id = this.requiresLocation() ? v.location_id : null;
    this.saving.set(true);
    const req =
      cur && cur !== 'new'
        ? this.api.update(cur.id, { name: v.name.trim(), role: v.role, location_id })
        : this.api.create({ email: v.email.trim(), password: v.password, role: v.role, location_id, name: v.name.trim() || null, must_change_password: v.must_change_password });
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toast.success(cur === 'new' ? 'Employee created. Share the email and password with them.' : 'Employee updated. They were signed out to apply the changes.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  async toggleActive(s: StaffMember): Promise<void> {
    const ok = await this.confirm.ask({
      title: s.is_active ? `Disable ${s.name}?` : `Enable ${s.name}?`,
      message: s.is_active ? 'The employee is signed out immediately and cannot sign in.' : 'The employee can sign in again.',
      danger: s.is_active,
      confirmText: s.is_active ? 'Disable' : 'Enable',
    });
    if (!ok) return;
    this.api.setActive(s.id, !s.is_active).subscribe(() => {
      this.toast.success(s.is_active ? 'Employee disabled.' : 'Employee enabled.');
      this.load();
    });
  }

  openReset(s: StaffMember): void {
    this.resetForm.reset({ new_password: '', must_change_password: true });
    this.resetFor.set(s);
  }

  generatePassword(target: 'create' | 'reset'): void {
    const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789'];
    const all = sets.join('');
    const rand = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0]! % s.length];
    let pwd = sets.map(rand).join('');
    while (pwd.length < 12) pwd += rand(all);
    pwd = pwd.split('').sort(() => crypto.getRandomValues(new Uint8Array(1))[0]! - 128).join('');
    if (target === 'create') this.form.controls.password.setValue(pwd);
    else this.resetForm.controls.new_password.setValue(pwd);
    void navigator.clipboard?.writeText(pwd).then(() => this.toast.info('Password generated and copied.'));
  }

  saveReset(): void {
    const s = this.resetFor();
    if (!s || this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.api.resetPassword(s.id, this.resetForm.getRawValue()).subscribe(() => {
      this.toast.success('Password reset. Share the new password with the employee.');
      this.resetFor.set(null);
    });
  }
}
