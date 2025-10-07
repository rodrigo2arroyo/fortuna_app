import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';

type MenuAction = 'logout' | null;
type MenuItem = {
  label: string;
  icon: string;
  route?: string;
  chevron?: boolean;
  action?: MenuAction;
};

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly router = inject(Router);

  readonly menu = signal<MenuItem[]>([
    { label: 'Inicio',            icon: 'assets/icons/Home.svg',           route: '/home',                chevron: true },
    { label: 'Fortuna Puntos',    icon: 'assets/icons/favorite-database.svg', route: '/home/recargar-puntos',     chevron: true },
    { label: 'Pagar',             icon: 'assets/icons/HandCoins.svg',     route: '/home/pagar',          chevron: true },
    { label: 'Reporte de deudas', icon: 'assets/icons/FileLineChart.svg',  route: '/home/reportes',       chevron: true },
    { label: 'Solicitar préstamo',icon: 'assets/icons/Handshake.svg',      route: '/home/solicitar',      chevron: true },
    { label: 'Cerrar Sesión',     icon: 'assets/icons/LogOut.svg',    action: 'logout',              chevron: false },
  ]);

  onItemClick(item: MenuItem) {
    if (item.action === 'logout') {
      // TODO: authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
