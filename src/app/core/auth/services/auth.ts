import { HttpContext } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, firstValueFrom, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Api } from '../../services/api';
import { Storage } from '../../services/storage';
import { SILENT_ERROR, SKIP_REFRESH } from '../../http/http-context';
import { ChangePasswordRequest, LoginRequest, LoginResult, StaffInfo, TokenPair } from '../../models';

// Staff session of the admin web dashboard (backend: AuthController + StaffMeController).
//  - POST /auth/login         with X-App: admin  -> access token in the body, refresh token in an HttpOnly cookie
//  - POST /auth/refresh       (cookie)           -> new access token (the cookie is rotated)
//  - POST /auth/logout        (cookie)
//  - GET  /staff/me                              -> name, role, permissions, must_change_password
// The access token lives in memory only; after a page reload the session is restored from the cookie.
//
// The refresh cookie is HttpOnly (JavaScript cannot see it). To avoid a useless POST /auth/refresh that
// answers 401 (red line in the console) when nobody is signed in, we keep a small hint in localStorage:
// "a session exists until <time>". It holds NO token, only a timestamp. No hint -> no refresh call.
const SESSION_HINT = 'session_until';
const ADMIN_REFRESH_HOURS = 12; // Jwt:AdminRefreshHours in the API appsettings.json

@Service()
export class Auth {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly storage = inject(Storage);

  private readonly token = signal<string | null>(null);
  readonly user = signal<StaffInfo | null>(null);

  readonly isAuthenticated = computed(() => !!this.token() && !!this.user());
  readonly mustChangePassword = computed(() => this.user()?.must_change_password === true);
  readonly permissions = computed(() => new Set(this.user()?.permissions ?? []));
  readonly displayName = computed(() => {
    const u = this.user();
    return u?.full_name?.trim() || u?.email || 'Administrator';
  });
  readonly initials = computed(() =>
    this.displayName()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]!.toUpperCase())
      .join(''),
  );

  private refresh$: Observable<string> | null = null;
  private restore: Promise<boolean> | null = null;

  accessToken(): string | null {
    return this.token();
  }

  hasPermission(...required: string[]): boolean {
    if (required.length === 0) return true;
    const set = this.permissions();
    return required.some((p) => set.has(p));
  }

  // identifier = the employee email. The API also signs customers in here, but with X-App: admin it
  // answers 403 AUDIENCE_WRONG for them; the kind check below is only a second safety net.
  login(identifier: string, password: string): Observable<LoginResult> {
    const context = new HttpContext().set(SKIP_REFRESH, true).set(SILENT_ERROR, true);
    const body: LoginRequest = { identifier, password };
    return this.api.post<LoginResult>('auth/login', body, context).pipe(
      switchMap((res) => {
        if (res.kind !== 'staff') {
          return throwError(() => ({ status: 403, code: 'AUDIENCE_WRONG', message: 'This account cannot use the admin dashboard.' }));
        }
        this.token.set(res.access_token);
        this.markSession();
        // staff info normally comes with the answer; if not, read it from /staff/me
        const staff$ = res.staff ? of(res.staff) : this.loadMe();
        return staff$.pipe(
          tap((staff) => this.user.set({ ...staff, must_change_password: res.must_change_password || staff.must_change_password })),
          map(() => res),
        );
      }),
    );
  }

  // Called on app start / by the guard: restores the session from the refresh cookie.
  ensureSession(): Promise<boolean> {
    if (this.isAuthenticated()) return Promise.resolve(true);
    if (!this.hasSessionHint()) return Promise.resolve(false); // nobody signed in on this browser: no request
    if (!this.restore) {
      this.restore = firstValueFrom(
        this.refresh().pipe(
          switchMap(() => this.loadMe()),
          map(() => true),
          catchError(() => of(false)),
        ),
      ).finally(() => (this.restore = null));
    }
    return this.restore;
  }

  // Single flight: parallel 401s share ONE refresh call (the refresh token is rotated on every use).
  refresh(): Observable<string> {
    if (!this.refresh$) {
      const context = new HttpContext().set(SKIP_REFRESH, true).set(SILENT_ERROR, true);
      this.refresh$ = this.api.post<TokenPair>('auth/refresh', {}, context).pipe(
        map((pair) => pair.access_token),
        tap((t) => {
          this.token.set(t);
          this.markSession();
        }),
        catchError((err) => {
          this.clear();
          return throwError(() => err);
        }),
        finalize(() => (this.refresh$ = null)),
        shareReplay(1),
      );
    }
    return this.refresh$;
  }

  loadMe(): Observable<StaffInfo> {
    return this.api.get<StaffInfo>('staff/me').pipe(tap((me) => this.user.set(me)));
  }

  changePassword(dto: ChangePasswordRequest): Observable<void> {
    return this.api.put<void>('staff/me/password', dto);
  }

  // After a password change the API invalidates the session (security stamp) -> sign in again.
  async logout(redirect = true): Promise<void> {
    const context = new HttpContext().set(SKIP_REFRESH, true).set(SILENT_ERROR, true);
    try {
      await firstValueFrom(this.api.post<void>('auth/logout', {}, context));
    } catch {
      /* the cookie is deleted by the API anyway; ignore network errors */
    }
    this.clear();
    if (redirect) await this.router.navigate(['/auth/login']);
  }

  // Session is over (refresh failed): go to the login page and come back afterwards.
  sessionExpired(): void {
    this.clear();
    const returnUrl = this.router.url.startsWith('/auth') ? undefined : this.router.url;
    void this.router.navigate(['/auth/login'], { queryParams: returnUrl ? { returnUrl } : undefined });
  }

  clear(): void {
    this.token.set(null);
    this.user.set(null);
    this.storage.remove(SESSION_HINT);
  }

  private markSession(): void {
    this.storage.set(SESSION_HINT, Date.now() + ADMIN_REFRESH_HOURS * 3_600_000);
  }

  private hasSessionHint(): boolean {
    const until = this.storage.get<number>(SESSION_HINT, 0);
    return typeof until === 'number' && until > Date.now();
  }
}
