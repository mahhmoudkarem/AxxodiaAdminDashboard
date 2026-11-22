import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { LocationListItem } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { CatalogApi } from '../../services/catalog-api';

@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, RouterLink],
  selector: 'app-locations-list',
  templateUrl: './locations-list.html',
})
export class LocationsList implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly rows = signal<LocationListItem[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly q = signal('');
  readonly active = signal<'' | 'true' | 'false'>('');

  // Re-ordering only makes sense on the full, unfiltered list.
  readonly canReorder = computed(
    () => this.auth.hasPermission(P.locations.edit) && !this.q() && !this.active() && this.total() <= this.pageSize,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .locations({
        page: this.page(),
        page_size: this.pageSize,
        q: this.q() || undefined,
        is_active: this.active() === '' ? null : this.active() === 'true',
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

  search(q: string): void {
    this.q.set(q);
    this.page.set(1);
    this.load();
  }

  filter(v: string): void {
    this.active.set(v as '' | 'true' | 'false');
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  move(index: number, dir: -1 | 1): void {
    const list = [...this.rows()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target]!, list[index]!];
    this.rows.set(list);
    this.api.reorderLocations(list.map((l) => l.id)).subscribe({
      next: () => this.toast.success('Order saved.'),
      error: () => this.load(),
    });
  }

  async remove(row: LocationListItem): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${row.name_en}?`,
      message: 'The location will be removed. Locations that still have unit types or rooms cannot be deleted.',
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.deleteLocation(row.id).subscribe(() => {
      this.toast.success('Location deleted.');
      this.load();
    });
  }
}
