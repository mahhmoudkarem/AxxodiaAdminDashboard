import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../auth/services/auth';
import { SKIP_REFRESH } from '../http/http-context';
import { Api } from '../services/api';

// Adds the headers every Axxodia API call of the web dashboard needs:
//   X-App: admin            (the API uses it to issue / check admin tokens and the refresh cookie)
//   Authorization: Bearer   (staff access token, kept in memory)
//   withCredentials         (only /auth/*: the refresh cookie path is /api/v1/auth)
// On 401 it refreshes the access token once and repeats the request.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(Api.base)) return next(req);

  const auth = inject(Auth);
  const isAuthCall = req.url.startsWith(`${Api.base}/auth/`);

  const withHeaders = (request: HttpRequest<unknown>, token: string | null) => {
    let headers = request.headers.set('X-App', 'admin');
    if (token && !isAuthCall) headers = headers.set('Authorization', `Bearer ${token}`);
    return request.clone({ headers, withCredentials: isAuthCall || request.withCredentials });
  };

  return next(withHeaders(req, auth.accessToken())).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!unauthorized || req.context.get(SKIP_REFRESH) || isAuthCall) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        catchError((refreshError) => {
          auth.sessionExpired();
          return throwError(() => refreshError);
        }),
        switchMap((token) => next(withHeaders(req, token))),
      );
    }),
  );
};
