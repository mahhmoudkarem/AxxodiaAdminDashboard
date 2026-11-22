import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { DashboardSummary, LocationListItem, Offer, ReservationListItem } from '../../../../core/models';
import { Storage } from '../../../../core/services/storage';
import { Loading } from '../../../../shared/components/loading/loading';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { CatalogApi } from '../../../catalog/services/catalog-api';
import { OffersApi } from '../../../offers/services/offers-api';
import { ReservationsApi } from '../../../reservations/services/reservations-api';
import { DashboardApi } from '../../services/dashboard-api';

@Component({
  imports: [StatCard, Loading, RouterLink, DatePipe, StatusBadge],
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.html',
})
export class DashboardHome implements OnInit {
  private readonly api = inject(DashboardApi);
  private readonly catalog = inject(CatalogApi);
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly offersApi = inject(OffersApi);
  private readonly storage = inject(Storage);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly summary = signal<DashboardSummary | null>(null);
  readonly locations = signal<LocationListItem[]>([]);
  readonly locationId = signal<number | null>(this.storage.get<number | null>('dashboard.location', null));
  readonly loading = signal(true);
  readonly upcoming = signal<ReservationListItem[]>([]);
  readonly offers = signal<Offer[]>([]);

  readonly taskRows = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const row = (label: string, key: keyof DashboardSummary['housekeeping']) => ({
      label,
      hk: s.housekeeping[key],
      mt: s.maintenance[key],
    });
    return [
      row('Waiting for customer service', 'waiting_for_customer_service'),
      row('Assigned', 'assigned'),
      row('In progress', 'in_progress'),
      row('Pending completion', 'pending_completion'),
      row('Completed today', 'completed_today'),
    ];
  });

  readonly maxTask = computed(() => Math.max(1, ...this.taskRows().flatMap((r) => [r.hk, r.mt])));

  ngOnInit(): void {
    if (this.auth.hasPermission(P.locations.view)) {
      this.catalog.allLocations().subscribe((res) => this.locations.set(res.data));
    }
    this.load();
    this.loadSide();
  }

  setLocation(value: string): void {
    const id = value ? Number(value) : null;
    this.locationId.set(id);
    this.storage.set('dashboard.location', id);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.summary(this.locationId()).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadSide(): void {
    forkJoin({
      reservations: this.auth.hasPermission(P.reservations.view) ? this.reservationsApi.list().pipe(catchError(() => of([]))) : of([]),
      offers: this.auth.hasPermission(P.offers.view) ? this.offersApi.list().pipe(catchError(() => of([]))) : of([]),
    }).subscribe(({ reservations, offers }) => {
      this.upcoming.set(
        reservations
          .filter((r) => r.status === 'Upcoming' || r.status === 'Active')
          .sort((a, b) => a.check_in.localeCompare(b.check_in))
          .slice(0, 6),
      );
      this.offers.set(offers.filter((o) => o.is_active).slice(0, 4));
    });
  }

  pct(v: number): number {
    return Math.round((v / this.maxTask()) * 100);
  }
}
