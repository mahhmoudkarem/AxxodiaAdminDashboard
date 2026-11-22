import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { P } from '../../../../core/constants/permissions';
import { LocationListItem, UnitType } from '../../../../core/models';
import { Confirm } from '../../../../core/services/confirm';
import { Toast } from '../../../../core/services/toast';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { SearchInput } from '../../../../shared/components/search-input/search-input';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { CatalogApi } from '../../services/catalog-api';

@Component({
  imports: [PageHeader, DataTable, SearchInput, StatusBadge, RouterLink, DecimalPipe],
  selector: 'app-unit-types-list',
  templateUrl: './unit-types-list.html',
})
export class UnitTypesList implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  readonly auth = inject(Auth);
  readonly P = P;

  readonly location = input<string>(); // ?location=3
  readonly rows = signal<UnitType[]>([]);
  readonly locations = signal<LocationListItem[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly q = signal('');
  readonly locationId = signal<number | null>(null);

  readonly locationName = computed(() => {
    const map = new Map(this.locations().map((l) => [l.id, l.name_en]));
    return (id: number) => map.get(id) ?? `#${id}`;
  });

  ngOnInit(): void {
    if (this.location()) this.locationId.set(Number(this.location()));
    this.api.allLocations().subscribe((res) => this.locations.set(res.data));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.unitTypes({ page: this.page(), page_size: this.pageSize, q: this.q() || undefined, location_id: this.locationId() }).subscribe({
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

  setLocation(v: string): void {
    this.locationId.set(v ? Number(v) : null);
    this.page.set(1);
    this.load();
  }

  goTo(p: number): void {
    this.page.set(p);
    this.load();
  }

  async remove(row: UnitType): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${row.name_en}?`,
      message: 'Unit types that still have rooms cannot be deleted.',
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.api.deleteUnitType(row.id).subscribe(() => {
      this.toast.success('Unit type deleted.');
      this.load();
    });
  }
}
