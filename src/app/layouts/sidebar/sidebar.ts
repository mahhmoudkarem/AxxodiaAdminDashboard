import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/auth/services/auth';
import { Layout } from '../../core/services/layout';
import { HumanizePipe } from '../../shared/pipes/humanize-pipe';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { MENU } from './menu';

@Component({
  imports: [RouterLink, RouterLinkActive, BrandLogo, HumanizePipe],
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  host: { class: 'block' },
})
export class Sidebar {
  readonly auth = inject(Auth);
  readonly layout = inject(Layout);

  // Only the menus the signed-in role can open.
  readonly groups = computed(() =>
    MENU.map((g) => ({ ...g, items: g.items.filter((i) => this.auth.hasPermission(...(i.permissions ?? []))) })).filter(
      (g) => g.items.length > 0,
    ),
  );

  logout(): void {
    void this.auth.logout();
  }
}
