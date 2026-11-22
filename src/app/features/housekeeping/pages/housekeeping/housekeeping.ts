import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { HousekeepingType, HousekeepingTypeRequest } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { TaskReport } from '../../../reports/components/task-report/task-report';
import { HousekeepingApi } from '../../services/housekeeping-api';

@Component({
  imports: [PageHeader, DataTable, StatusBadge, Modal, ReactiveFormsModule, TaskReport],
  selector: 'app-housekeeping',
  templateUrl: './housekeeping.html',
})
export class Housekeeping implements OnInit {
  private readonly api = inject(HousekeepingApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);

  readonly canSeeTasks = computed(() => this.auth.hasPermission(P.reports.view));
  readonly canManageTypes = computed(() => this.auth.hasPermission(P.housekeepingTypes.manage));
  readonly tab = signal<'tasks' | 'types'>(this.auth.hasPermission(P.reports.view) ? 'tasks' : 'types');

  readonly types = signal<HousekeepingType[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<HousekeepingType | 'new' | null>(null);
  readonly saving = signal(false);
  readonly iconSuggestions = ['fa-broom', 'fa-bed', 'fa-soap', 'fa-shirt', 'fa-trash-can', 'fa-spray-can-sparkles', 'fa-toilet-paper', 'fa-utensils', 'fa-bath'];

  readonly form = inject(FormBuilder).nonNullable.group({
    name_en: ['', [Validators.required, Validators.maxLength(80)]],
    name_ar: ['', [Validators.required, Validators.maxLength(80)]],
    icon: ['', Validators.maxLength(40)],
    sort_order: [0],
    is_active: [true],
  });

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.loading.set(true);
    this.api.types().subscribe({
      next: (list) => {
        this.types.set([...list].sort((a, b) => a.sort_order - b.sort_order));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(t: HousekeepingType | 'new'): void {
    this.form.reset({ name_en: '', name_ar: '', icon: '', sort_order: this.types().length + 1, is_active: true });
    if (t !== 'new') this.form.patchValue({ ...t, icon: t.icon ?? '' });
    this.editing.set(t);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: HousekeepingTypeRequest = { ...v, name_en: v.name_en.trim(), name_ar: v.name_ar.trim(), icon: v.icon || null, sort_order: Number(v.sort_order) };
    const cur = this.editing();
    this.saving.set(true);
    const req: Observable<unknown> = cur && cur !== 'new' ? this.api.update(cur.id, dto) : this.api.create(dto);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toast.success('Type saved.');
        this.loadTypes();
      },
      error: () => this.saving.set(false),
    });
  }

  async remove(t: HousekeepingType): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${t.name_en}?`,
      message: 'If guests already used this type, deactivate it instead.',
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.delete(t.id).subscribe(() => {
      this.toast.success('Type deleted.');
      this.loadTypes();
    });
  }
}
