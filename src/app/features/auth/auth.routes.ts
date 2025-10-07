import {Routes} from '@angular/router';
import {AuthComponent} from './auth.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth.component').then(c => c.AuthComponent),
  },
];
