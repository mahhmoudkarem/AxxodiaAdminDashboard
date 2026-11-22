import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { SILENT_ERROR } from '../http/http-context';
import { ApiError } from '../models';
import { Toast } from '../services/toast';

// Turns every failed call into one ApiError shape:
//   API:  { "error": { "code", "message", "fields", "retry_after_seconds" } }
//   ASP.NET ValidationProblem: { "title", "errors": { field: [..] } }
// and shows a toast (unless the request is SILENT_ERROR). 401 is handled by authInterceptor.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(Toast);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      return from(toApiError(error)).pipe(
        switchMap((apiError) => {
          if (apiError.code === 'PASSWORD_CHANGE_REQUIRED') {
            void router.navigate(['/auth/change-password']);
          } else if (!req.context.get(SILENT_ERROR) && apiError.status !== 401) {
            toast.error(apiError.message);
          }
          return throwError(() => apiError);
        }),
      );
    }),
  );
};

async function toApiError(error: HttpErrorResponse): Promise<ApiError> {
  let body: any = error.error;

  // Blob answers (report export) carry the JSON error as a Blob.
  if (body instanceof Blob) {
    try {
      body = JSON.parse(await body.text());
    } catch {
      body = null;
    }
  }

  if (error.status === 0) {
    return { status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server. Check your connection and try again.' };
  }

  const e = body?.error;
  if (e && typeof e === 'object') {
    return {
      status: error.status,
      code: e.code ?? 'ERROR',
      message: e.message ?? defaultMessage(error.status),
      fields: e.fields,
      retryAfterSeconds: e.retry_after_seconds,
    };
  }

  if (body?.errors && typeof body.errors === 'object') {
    const fields = body.errors as Record<string, string[]>;
    const first = Object.values(fields).flat()[0];
    return { status: error.status, code: 'VALIDATION_ERROR', message: first ?? body.title ?? defaultMessage(error.status), fields };
  }

  return { status: error.status, code: 'ERROR', message: body?.title ?? defaultMessage(error.status) };
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Please check the entered data.';
    case 403:
      return 'You do not have permission to do this.';
    case 404:
      return 'Not found.';
    case 409:
      return 'This item was changed or is in use. Reload and try again.';
    case 429:
      return 'Too many requests. Please wait a moment.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
