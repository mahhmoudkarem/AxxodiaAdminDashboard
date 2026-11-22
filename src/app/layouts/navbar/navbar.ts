import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, filter, interval, of, startWith, switchMap } from 'rxjs';
import { Auth } from '../../core/auth/services/auth';
import { AppNotification } from '../../core/models';
import { Layout } from '../../core/services/layout';
import { NotificationsApi } from '../../features/notifications/services/notifications-api';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { HumanizePipe } from '../../shared/pipes/humanize-pipe';

@Component({
  imports: [RouterLink, DatePipe, BrandLogo, HumanizePipe],
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  host: {
    class: 'block sticky top-0 z-30',
    '(document:click)': 'closeMenus()',
  },
})
export class Navbar implements OnInit {
  readonly auth = inject(Auth);
  readonly layout = inject(Layout);
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly unread = signal(0);
  readonly bellOpen = signal(false);
  readonly userOpen = signal(false);
  readonly latest = signal<AppNotification[]>([]);
  readonly latestLoading = signal(false);
  readonly today = new Date();
  private pauseUntil = 0;

  ngOnInit(): void {
    // Badge on the bell: GET /staff/me/notifications/unread-count every 60 s.
    // If the server fails, wait 5 minutes before asking again (no repeated errors in the console).
    interval(60_000)
      .pipe(
        startWith(0),
        filter(() => Date.now() >= this.pauseUntil),
        switchMap(() =>
          this.notificationsApi.unreadCount().pipe(
            catchError(() => {
              this.pauseUntil = Date.now() + 5 * 60_000;
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => res && this.unread.set(res.unread_count));
  }

  toggleBell(event: Event): void {
    event.stopPropagation();
    this.userOpen.set(false);
    this.bellOpen.update((v) => !v);
    if (this.bellOpen()) this.loadLatest();
  }

  toggleUser(event: Event): void {
    event.stopPropagation();
    this.bellOpen.set(false);
    this.userOpen.update((v) => !v);
  }

  closeMenus(): void {
    this.bellOpen.set(false);
    this.userOpen.set(false);
  }

  loadLatest(): void {
    this.latestLoading.set(true);
    this.notificationsApi.list({ page: 1, page_size: 6 }).subscribe({
      next: (res) => {
        this.latest.set(res.data);
        this.latestLoading.set(false);
      },
      error: () => this.latestLoading.set(false),
    });
  }

  open(n: AppNotification, event: Event): void {
    event.stopPropagation();
    if (!n.is_read) {
      this.notificationsApi.markRead(n.id).subscribe(() => {
        this.latest.update((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        this.unread.update((c) => Math.max(0, c - 1));
      });
    }
  }

  markAll(event: Event): void {
    event.stopPropagation();
    this.notificationsApi.markAllRead().subscribe(() => {
      this.unread.set(0);
      this.latest.update((list) => list.map((x) => ({ ...x, is_read: true })));
    });
  }

  goAll(): void {
    this.closeMenus();
    void this.router.navigate(['/notifications']);
  }

  logout(): void {
    void this.auth.logout();
  }
}
