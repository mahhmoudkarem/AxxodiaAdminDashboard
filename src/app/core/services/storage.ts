import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';

// Safe localStorage wrapper (no crash on the server or in private mode).
// Only UI preferences are kept here; tokens are NEVER stored in localStorage.
@Service()
export class Storage {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly prefix = 'axxodia.admin.';

  get<T>(key: string, fallback: T): T {
    if (!this.isBrowser) return fallback;
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  set(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* ignore */
    }
  }
}
