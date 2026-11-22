import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AppNotification, NOTIFICATION_CATEGORIES, NotificationPreference } from '../../../../core/models';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { NotificationsApi } from '../../services/notifications-api';

const CATEGORY_ICONS: Record<string, string> = {
  Reservation: 'fa-calendar-check',
  Stay: 'fa-bed',
  Chat: 'fa-comments',
  Housekeeping: 'fa-broom',
  Maintenance: 'fa-screwdriver-wrench',
  GuestServices: 'fa-bell-concierge',
  Offers: 'fa-tags',
  System: 'fa-gear',
};

@Component({
  imports: [PageHeader, DataTable, HumanizePipe, DatePipe],
  selector: 'app-notifications',
  templateUrl: './notifications.html',
})
export class Notifications implements OnInit {
  private readonly api = inject(NotificationsApi);
  private readonly toast = inject(Toast);
  readonly categories = NOTIFICATION_CATEGORIES;
  readonly icons = CATEGORY_ICONS;

  readonly rows = signal<AppNotification[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly category = signal('');
  readonly unreadOnly = signal(false);
  readonly prefs = signal<NotificationPreference[]>([]);
  readonly showPrefs = signal(false);

  ngOnInit(): void {
    this.load();
    this.api.preferences().subscribe({ next: (p) => this.prefs.set(p), error: () => {} });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list({ page: this.page(), page_size: this.pageSize, category: this.category() || null, isRead: this.unreadOnly() ? false : null })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data);
          this.total.set(res.meta.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  setCategory(c: string): void {
    this.category.set(c);
    this.page.set(1);
    this.load();
  }

  toggleUnread(v: boolean): void {
    this.unreadOnly.set(v);
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  read(n: AppNotification): void {
    if (n.is_read) return;
    this.api.markRead(n.id).subscribe(() => this.rows.update((l) => l.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))));
  }

  readAll(): void {
    this.api.markAllRead().subscribe(() => {
      this.toast.success('All notifications marked as read.');
      this.load();
    });
  }

  remove(n: AppNotification, e: Event): void {
    e.stopPropagation();
    this.api.delete(n.id).subscribe(() => this.load());
  }

  togglePref(p: NotificationPreference): void {
    this.api.updatePreference(p.category, !p.is_enabled).subscribe(() =>
      this.prefs.update((list) => list.map((x) => (x.category === p.category ? { ...x, is_enabled: !p.is_enabled } : x))),
    );
  }
}
