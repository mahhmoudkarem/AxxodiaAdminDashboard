import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Toast } from './toast';

// Replaces Angular's default ErrorHandler (which writes every error to the console).
// Any unexpected error is shown to the user as an alert (toast) instead.
// API errors are already shown by errorInterceptor, so they are not shown twice.
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(Toast);
  private lastMessage = '';
  private lastAt = 0;

  handleError(error: unknown): void {
    const err = (error as { rejection?: unknown })?.rejection ?? error; // unhandled promise
    if (isApiError(err)) return; // already shown by errorInterceptor
    const message = 'Something went wrong on this page. Please reload and try again.';
    // do not show the same alert many times in a row
    const now = Date.now();
    if (message === this.lastMessage && now - this.lastAt < 4000) return;
    this.lastMessage = message;
    this.lastAt = now;
    this.toast.error(message);
  }
}

function isApiError(e: unknown): boolean {
  return !!e && typeof e === 'object' && 'status' in e && 'code' in e && 'message' in e;
}
