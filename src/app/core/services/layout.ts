import { Service, signal } from '@angular/core';

// Mobile sidebar drawer state (shared by the navbar button and the sidebar).
@Service()
export class Layout {
  readonly mobileMenuOpen = signal(false);

  toggle(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  close(): void {
    this.mobileMenuOpen.set(false);
  }
}
