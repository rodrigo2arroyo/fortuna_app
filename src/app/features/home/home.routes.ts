import {Routes} from '@angular/router';
import {HomeComponent} from './home.component';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: HomeComponent, // layout con header
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
      },
      {
        path: 'recargar-puntos',
        pathMatch: 'full',
        loadComponent: () =>
          import('./recargar-puntos/recargar-puntos.component').then(c => c.RecargarPuntosComponent),
      },
      {
        path: 'garantizar-puntos',
        pathMatch: 'full',
        loadComponent: () =>
          import('./garantizar-puntos/garantizar-puntos.component').then(c => c.GarantizarPuntosComponent),
      },
      {
        path: 'mis-prestamos',
        pathMatch: 'full',
        loadComponent: () =>
          import('./mis-prestamos/mis-prestamos.component').then(c => c.MisPrestamosComponent),
      },
    ],
  },
];
