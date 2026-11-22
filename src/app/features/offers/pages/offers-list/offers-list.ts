import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { Offer } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { FileUrlPipe } from '../../../../shared/pipes/file-url-pipe';
import { HumanizePipe } from '../../../../shared/pipes/humanize-pipe';
import { OffersApi } from '../../services/offers-api';

@Component({
  imports: [PageHeader, Loading, EmptyState, StatusBadge, RouterLink, DatePipe, FileUrlPipe, HumanizePipe],
  selector: 'app-offers-list',
  templateUrl: './offers-list.html',
})
export class OffersList implements OnInit {
  private readonly api = inject(OffersApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly all = signal<Offer[]>([]);
  readonly loading = signal(true);
  readonly tab = signal<'all' | 'live' | 'scheduled' | 'ended' | 'draft'>('all');
  private readonly now = Date.now();

  phase(o: Offer): 'live' | 'scheduled' | 'ended' | 'draft' {
    if (!o.is_active) return 'draft';
    const start = new Date(o.start_date).getTime();
    const end = new Date(o.end_date).getTime();
    if (end < this.now) return 'ended';
    if (start > this.now) return 'scheduled';
    return 'live';
  }

  readonly visible = computed(() => (this.tab() === 'all' ? this.all() : this.all().filter((o) => this.phase(o) === this.tab())));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (list) => {
        this.all.set([...list].sort((a, b) => b.created_at.localeCompare(a.created_at)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(o: Offer): void {
    this.api.setActive(o.id, !o.is_active).subscribe(() => {
      this.toast.success(o.is_active ? 'Offer unpublished.' : 'Offer published. Customers are notified.');
      this.all.update((list) => list.map((x) => (x.id === o.id ? { ...x, is_active: !o.is_active } : x)));
    });
  }

  async remove(o: Offer): Promise<void> {
    const ok = await this.confirm.ask({ title: `Delete "${o.title}"?`, danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.api.delete(o.id).subscribe(() => {
      this.toast.success('Offer deleted.');
      this.load();
    });
  }
}
