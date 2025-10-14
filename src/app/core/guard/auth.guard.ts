import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../shared/stores/auth.store';

export const authGuard: CanActivateFn = (state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url } });
};
