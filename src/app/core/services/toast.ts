import { Service, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

@Service()
export class Toast {
  private nextId = 1;
  readonly items = signal<ToastItem[]>([]);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message, 6000);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message, 6000);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  private show(kind: ToastKind, message: string, ms = 3500): void {
    const id = this.nextId++;
    this.items.update((list) => [...list.slice(-3), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}
