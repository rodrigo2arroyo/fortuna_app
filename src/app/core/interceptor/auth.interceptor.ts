import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, from, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../../shared/stores/auth.store';
import { AuthService } from '../../features/auth/services/auth.service';

const isAuthRoute = (url: string) => /\/(login|refresh)(\?|$)/.test(url);

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

const shouldTryRefresh = (req: Request | any, err: HttpErrorResponse) =>
  (err.status === 401 || err.status === 403) && !req.headers?.has('X-Refresh-Retry');

const ensureBearer = (t: string | null | undefined) =>
  t ? (t.startsWith('Bearer ') ? t : `Bearer ${t}`) : null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store  = inject(AuthStore);
  const auth   = inject(AuthService);
  const router = inject(Router);

  const bearer = ensureBearer(store.token());
  const authReq =
    bearer && !isAuthRoute(req.url)
      ? req.clone({ setHeaders: { Authorization: bearer } })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || !shouldTryRefresh(authReq, err)) {
        return throwError(() => err);
      }

      if (isAuthRoute(authReq.url)) {
        store.clear();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((newToken) => {
            const retryBearer = ensureBearer(newToken);
            const retry = retryBearer
              ? authReq.clone({ setHeaders: { Authorization: retryBearer, 'X-Refresh-Retry': '1' } })
              : authReq.clone({ setHeaders: { 'X-Refresh-Retry': '1' } });

            return next(retry).pipe(
              catchError((e2: HttpErrorResponse) => {
                if (e2.status === 401) {
                  store.clear();
                  router.navigate(['/auth/login']);
                }
                return throwError(() => e2);
              })
            );
          })
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return from(auth.refreshFromStore()).pipe(
        switchMap(() => {
          const refreshed = ensureBearer(store.token());

          refreshSubject.next(refreshed ?? null);

          const retry = refreshed
            ? authReq.clone({ setHeaders: { Authorization: refreshed, 'X-Refresh-Retry': '1' } })
            : authReq.clone({ setHeaders: { 'X-Refresh-Retry': '1' } });

          return next(retry).pipe(
            catchError((e2: HttpErrorResponse) => {
              if (e2.status === 401) {
                store.clear();
                router.navigate(['/auth/login']);
              }
              return throwError(() => e2);
            })
          );
        }),
        catchError((e) => {
          store.clear();
          router.navigate(['/auth/login']);
          return throwError(() => e);
        }),
        finalize(() => {
          isRefreshing = false;
        })
      );
    })
  );
};
