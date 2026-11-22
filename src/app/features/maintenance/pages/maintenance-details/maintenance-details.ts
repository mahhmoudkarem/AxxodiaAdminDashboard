import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { MaintenanceTask, Room } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { formatDuration } from '../../../../core/utils/format';
import { Loading } from '../../../../shared/components/loading/loading';
import { Modal } from '../../../../shared/components/modal/modal';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { MaintenanceApi } from '../../services/maintenance-api';

@Component({
  imports: [PageHeader, Loading, StatusBadge, Modal, DatePipe, HumanizePipe, FormsModule, LowerCasePipe],
  selector: 'app-maintenance-details',
  templateUrl: './maintenance-details.html',
})
export class MaintenanceDetails implements OnInit {
  private readonly api = inject(MaintenanceApi);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  readonly id = input.required<string>();
  readonly task = signal<MaintenanceTask | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly canAct = computed(() => this.auth.hasPermission(P.maintenance.assign));
  readonly duration = formatDuration;

  readonly editOpen = signal(false);
  readonly rooms = signal<Room[]>([]);
  editRoomId: number | null = null;
  editDescription = '';
  readonly preview = signal<string | null>(null);

  readonly before = computed(() => this.task()?.images.filter((i) => i.type === 'Before') ?? []);
  readonly after = computed(() => this.task()?.images.filter((i) => i.type === 'After') ?? []);
  readonly open = computed(() => {
    const s = this.task()?.status;
    return s !== 'Completed' && s !== 'Cancelled';
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Photo links are signed for 15 minutes: reload the task to get fresh links.
    this.api.get(Number(this.id())).subscribe({
      next: (t) => {
        this.task.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private run(req: Observable<unknown>, msg: string): void {
    this.busy.set(true);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(msg);
        this.load();
      },
      error: () => this.busy.set(false),
    });
  }

  async start(): Promise<void> {
    const ok = await this.confirm.ask({ title: 'Start this task?', message: 'It is started on behalf of the assigned employee.' });
    if (ok) this.run(this.api.start(Number(this.id())), 'Task started.');
  }

  async end(): Promise<void> {
    const ok = await this.confirm.ask({ title: 'End this task?', message: 'It is ended on behalf of the assigned employee.' });
    if (ok) this.run(this.api.end(Number(this.id())), 'Task ended.');
  }

  async remove(): Promise<void> {
    const ok = await this.confirm.ask({ title: 'Delete this task?', danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.api.delete(Number(this.id())).subscribe(() => {
      this.toast.success('Task deleted.');
      void this.router.navigate(['/maintenance']);
    });
  }

  openEdit(): void {
    const t = this.task();
    if (!t) return;
    this.editRoomId = t.room_id;
    this.editDescription = t.description;
    this.catalog.rooms({ location_id: t.location_id, page: 1, page_size: 100 }).subscribe((res) => this.rooms.set(res.data));
    this.editOpen.set(true);
  }

  saveEdit(): void {
    if (!this.editRoomId || !this.editDescription.trim()) return;
    this.editOpen.set(false);
    this.run(this.api.update(Number(this.id()), { room_id: this.editRoomId, description: this.editDescription.trim() }), 'Task updated.');
  }
}
