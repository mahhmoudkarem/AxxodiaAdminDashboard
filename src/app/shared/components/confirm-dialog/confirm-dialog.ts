import { Component, inject, signal } from '@angular/core';
import { Confirm } from '../../../core/services/confirm';

// Rendered once in the admin layout; opened with Confirm.ask() / Confirm.askReason().
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly confirm = inject(Confirm);
  readonly reason = signal('');

  submit(): void {
    const s = this.confirm.state();
    if (!s) return;
    if (s.reason) {
      const text = this.reason().trim();
      if (s.reason.required !== false && !text) return;
      this.confirm.close(text);
    } else {
      this.confirm.close(true);
    }
    this.reason.set('');
  }

  cancel(): void {
    this.reason.set('');
    this.confirm.close(null);
  }
}
