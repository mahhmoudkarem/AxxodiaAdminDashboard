import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// route data: { permissions: ['rooms.view', ...] }  -> the user needs ANY of them.
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const required = (route.data?.['permissions'] as string[] | undefined) ?? [];

  if (auth.hasPermission(...required)) return true;
  return router.createUrlTree(['/forbidden']);
};
