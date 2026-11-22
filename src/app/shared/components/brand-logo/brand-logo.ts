import { Component, computed, input } from '@angular/core';

// The Axxodia logo, used everywhere in the dashboard.
//   variant = full  -> gold mark + black "AXXODIA"  (light backgrounds)
//             light -> gold mark + white "AXXODIA"  (dark backgrounds)
//             mark  -> gold mark only               (icons, small places)
@Component({
  selector: 'app-brand-logo',
  template: `<img [src]="src()" [alt]="alt()" [class]="imgClass()" draggable="false" />`,
  host: { class: 'inline-flex shrink-0 items-center' },
})
export class BrandLogo {
  readonly variant = input<'full' | 'light' | 'mark'>('full');
  readonly imgClass = input('h-12 w-auto');
  readonly alt = input('Axxodia');

  readonly src = computed(() => {
    switch (this.variant()) {
      case 'light':
        return 'images/brand/axxodia-logo-light.png';
      case 'mark':
        return 'images/brand/axxodia-mark.png';
      default:
        return 'images/brand/axxodia-logo.png';
    }
  });
}
