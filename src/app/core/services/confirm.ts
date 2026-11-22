import { Service, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  // Ask for a reason (cancel reservation / stay ...). The promise then resolves with the text.
  reason?: { label: string; required?: boolean; maxLength?: number };
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: string | boolean | null) => void;
}

// await confirm.ask({...})  -> true / false
// await confirm.askReason({...}) -> reason text or null
@Service()
export class Confirm {
  readonly state = signal<ConfirmState | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({ ...options, reason: undefined, resolve: (v) => resolve(v === true) });
    });
  }

  askReason(options: ConfirmOptions & { reason: NonNullable<ConfirmOptions['reason']> }): Promise<string | null> {
    return new Promise((resolve) => {
      this.state.set({ ...options, resolve: (v) => resolve(typeof v === 'string' ? v : null) });
    });
  }

  close(value: string | boolean | null): void {
    const current = this.state();
    this.state.set(null);
    current?.resolve(value);
  }
}
