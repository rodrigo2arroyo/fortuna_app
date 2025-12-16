import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, from, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../../shared/stores/auth.store';
import { AuthService } from '../../features/auth/services/auth.service';
import {AuthStoreService} from '../../features/auth/services/auth.store.service';

const isAuthRoute = (url: string) => /\/(login|refresh)(\?|$)/.test(url);

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

const shouldTryRefresh = (req: Request | any, err: HttpErrorResponse) =>
  (err.status === 401 || err.status === 403) && !req.headers?.has('X-Refresh-Retry');

const ensureBearer = (t: string | null | undefined) =>
  t ? (t.startsWith('Bearer ') ? t : `Bearer ${t}`) : null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userStore    = inject(AuthStore);
  const serviceStore = inject(AuthStoreService);
  const auth         = inject(AuthService);
  const router       = inject(Router);

  const isService = req.headers.get('X-Auth-Mode') === 'service';

  const cleanReq = req.headers.has('X-Auth-Mode')
    ? req.clone({ headers: req.headers.delete('X-Auth-Mode') })
    : req;

  const token  = isService ? serviceStore.token() : userStore.token();
  const bearer = ensureBearer(token);

  const authReq =
    bearer && !isAuthRoute(cleanReq.url)
      ? cleanReq.clone({ setHeaders: { Authorization: bearer } })
      : cleanReq;

  if (isService && !bearer && !isAuthRoute(cleanReq.url)) {
    return from(auth.getServiceToken()).pipe(
      switchMap((t) =>
        next(cleanReq.clone({ setHeaders: { Authorization: ensureBearer(t)! } }))
      ),
      catchError((e) => throwError(() => e))
    );
  }

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (isService && err instanceof HttpErrorResponse && shouldTryRefresh(authReq, err)) {
        if (authReq.headers.has('X-Refresh-Retry')) {
          serviceStore.clear();
          return throwError(() => err);
        }

        serviceStore.clear();

        return from((async () => {serviceStore.clear();return await auth.getServiceToken();})()).pipe(
          switchMap((t) => {
            const retry = authReq.clone({
              setHeaders: {
                Authorization: ensureBearer(t)!,
                'X-Refresh-Retry': '1',
              },
            });
            return next(retry);
          }),
          catchError((e2) => throwError(() => e2))
        );
      }

      if (!(err instanceof HttpErrorResponse) || !shouldTryRefresh(authReq, err)) {
        return throwError(() => err);
      }

      if (isAuthRoute(authReq.url)) {
        userStore.clear();
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
                  userStore.clear();
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
          const refreshed = ensureBearer(userStore.token());
          refreshSubject.next(refreshed ?? null);

          const retry = refreshed
            ? authReq.clone({ setHeaders: { Authorization: refreshed, 'X-Refresh-Retry': '1' } })
            : authReq.clone({ setHeaders: { 'X-Refresh-Retry': '1' } });

          return next(retry).pipe(
            catchError((e2: HttpErrorResponse) => {
              if (e2.status === 401) {
                userStore.clear();
                router.navigate(['/auth/login']);
              }
              return throwError(() => e2);
            })
          );
        }),
        catchError((e) => {
          userStore.clear();
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
