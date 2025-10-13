import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import {TokenStoreService} from '../../shared/services/toke-store.service';

export const authGuard: CanActivateFn = () => {
  const tokenStore = inject(TokenStoreService);
  const router = inject(Router);
  const token = tokenStore.token();

  if (!token || token.trim().length === 0) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};
