import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import {TokenStoreService} from '../../shared/services/toke-store.service';
import {AuthService} from '../../features/auth/services/auth.service';

const isAuthRoute = (url: string) => /\/(login|refresh)(\?|$)/.test(url);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(TokenStoreService);
  const auth  = inject(AuthService);
  const router = inject(Router);

  const token = store.token();
  const withAuth =
    token && !isAuthRoute(req.url)
      ? req.clone({ setHeaders: { Authorization: token } })
      : req;

  return next(withAuth).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (isAuthRoute(req.url)) {
        store.clear();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }
      return from(auth.refreshFromStore()).pipe(
        switchMap(() => {
          const newToken = store.token();
          const retryReq = newToken
            ? withAuth.clone({ setHeaders: { Authorization: newToken } })
            : withAuth;
          return next(retryReq);
        }),
        catchError((e) => {
          store.clear();
          router.navigate(['/auth/login']);
          return throwError(() => e);
        })
      );
    })
  );
};
