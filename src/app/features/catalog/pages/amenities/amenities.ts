import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { amenityIcon } from '../../../../core/constants/amenity-icons';
import { Amenity } from '../../../../core/models';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Loading } from '../../../../shared/components/loading/loading';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { CatalogApi } from '../../services/catalog-api';

// AmenitiesController is READ ONLY now: the list is fixed in the API (AmenityCatalog: wifi, gym, sauna...).
// The admin picks from it in the location / unit type forms.
@Component({
  imports: [PageHeader, Loading, EmptyState],
  selector: 'app-amenities',
  templateUrl: './amenities.html',
})
export class Amenities implements OnInit {
  private readonly api = inject(CatalogApi);

  readonly rows = signal<Amenity[]>([]);
  readonly loading = signal(true);
  readonly filter = signal('');
  readonly icon = amenityIcon;

  readonly visible = computed(() => {
    const f = this.filter().trim().toLowerCase();
    return f
      ? this.rows().filter((a) => a.name_en.toLowerCase().includes(f) || a.name_ar.includes(f) || (a.code ?? '').includes(f))
      : this.rows();
  });

  ngOnInit(): void {
    this.api.amenities().subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
