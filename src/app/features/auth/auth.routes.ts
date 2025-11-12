import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: '**', redirectTo: 'login' },
    ],
  },
];
