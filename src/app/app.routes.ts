import { Routes } from '@angular/router';
import { guestGuard } from './core/guard/guest.guard';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  // 🔹 Redirección raíz: envía directamente al login dentro del módulo Auth
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  // 🔹 Redirección por defecto ante rutas desconocidas
  { path: '**', redirectTo: '/auth/login' },
];
