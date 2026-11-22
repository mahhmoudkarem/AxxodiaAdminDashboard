import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// Private pages: restore the session from the refresh cookie, otherwise go to the login page.
// While must_change_password is true the API blocks everything else, so send the user to change it first.
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const ok = await auth.ensureSession();
  if (!ok) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/auth/change-password']);
  }

  return true;
};

// Login page: an already signed-in user goes straight to the dashboard.
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const ok = await auth.ensureSession();
  if (ok && !auth.mustChangePassword()) return router.createUrlTree(['/dashboard']);
  return true;
};

// Change-password page: needs a session (it is also used for the forced first change).
export const sessionGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const ok = await auth.ensureSession();
  return ok ? true : router.createUrlTree(['/auth/login']);
};
