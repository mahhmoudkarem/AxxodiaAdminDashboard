import { Component, input, model } from '@angular/core';
import { amenityIcon } from '../../../../core/constants/amenity-icons';
import { Amenity } from '../../../../core/models';

// Toggle chips for amenity_ids (locations and unit types). The list itself is fixed in the API.
@Component({
  selector: 'app-amenity-picker',
  template: `
    <div class="flex flex-wrap gap-2">
      @for (a of amenities(); track a.id) {
        <button
          type="button"
          class="chip border transition"
          [disabled]="disabled()"
          [class]="selected().includes(a.id) ? 'border-brand-brown bg-brand-brown text-white' : 'border-brand-beige bg-white text-stone-500 hover:border-brand-taupe'"
          (click)="toggle(a.id)"
        >
          <i class="fa-solid {{ icon(a.code) }} text-[11px]"></i>
          {{ a.name_en }}
        </button>
      } @empty {
        <p class="muted">The amenity list is empty.</p>
      }
    </div>
  `,
})
export class AmenityPicker {
  readonly amenities = input<Amenity[]>([]);
  readonly selected = model<number[]>([]);
  readonly disabled = input(false);
  readonly icon = amenityIcon;

  toggle(id: number): void {
    const cur = this.selected();
    this.selected.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }
}
