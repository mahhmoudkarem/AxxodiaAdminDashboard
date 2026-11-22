import { Component, computed, inject, signal } from '@angular/core';
import { Auth } from '../../../../core/auth/services/auth';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { BrandLogo } from '../../../../shared/components/brand-logo/brand-logo';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { ChangePassword } from '../../../auth/pages/change-password/change-password';
import { DemoDataApi } from '../../../settings/services/demo-data-api';

@Component({
  imports: [PageHeader, ChangePassword, HumanizePipe, BrandLogo],
  selector: 'app-profile',
  templateUrl: './profile.html',
})
export class Profile {
  readonly auth = inject(Auth);
  private readonly demo = inject(DemoDataApi);
  private readonly confirm = inject(Confirm);
  private readonly toast = inject(Toast);

  // POST / DELETE /admin/demo-data: the API allows it for the super admin only.
  readonly isSuperAdmin = computed(() => this.auth.user()?.role === 'super_admin');
  readonly demoBusy = signal<'create' | 'remove' | null>(null);
  readonly demoMessage = signal<string | null>(null);

  async createDemo(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Create test data?',
      message: 'Adds fake locations, rooms, customers, staff, reservations, chats and tasks so you can try every screen. Running it twice does nothing.',
      confirmText: 'Create',
    });
    if (!ok) return;
    this.demoBusy.set('create');
    this.demo.create().subscribe({
      next: (res) => {
        this.demoBusy.set(null);
        this.demoMessage.set(res?.message ?? 'Test data created.');
        this.toast.success('Test data created.');
      },
      error: () => this.demoBusy.set(null),
    });
  }

  async removeDemo(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Remove test data?',
      message: 'Deletes ONLY the fake test data. Your real data is not touched.',
      danger: true,
      confirmText: 'Remove',
    });
    if (!ok) return;
    this.demoBusy.set('remove');
    this.demo.remove().subscribe({
      next: (res) => {
        this.demoBusy.set(null);
        this.demoMessage.set(res?.message ?? 'Test data removed.');
        this.toast.success('Test data removed.');
      },
      error: () => this.demoBusy.set(null),
    });
  }
}
