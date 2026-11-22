import { Component, inject } from '@angular/core';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(92vw,380px)] flex-col gap-2">
      @for (t of toast.items(); track t.id) {
        <div class="pointer-events-auto card flex items-start gap-3 border-l-4 p-4 shadow-lg" [class]="border(t.kind)">
          <i class="fa-solid mt-0.5 {{ icon(t.kind) }}"></i>
          <p class="flex-1 text-sm text-brand-dark">{{ t.message }}</p>
          <button type="button" class="text-stone-400 hover:text-brand-brown" (click)="toast.dismiss(t.id)" aria-label="Dismiss">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  readonly toast = inject(Toast);

  border(kind: string): string {
    return { success: 'border-l-success text-success', error: 'border-l-danger text-danger', warning: 'border-l-warning text-warning', info: 'border-l-info text-info' }[kind] ?? '';
  }

  icon(kind: string): string {
    return { success: 'fa-circle-check', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' }[kind] ?? 'fa-circle-info';
  }
}
