import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import {DashboardService} from '../services/dashboard.service';
import {DashboardData} from '../models/dashboard.models';
import {Skeleton} from 'primeng/skeleton';

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
    RouterLinkActive,
    Skeleton
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly dashboardSvc = inject(DashboardService);

  readonly menu = signal<MenuItem[]>([
    { label: 'Inicio', icon: 'assets/icons/Home.svg', route: '/home', chevron: true },
    { label: 'Solicitar préstamo', icon: 'assets/icons/Handshake.svg', route: '/home/solicitar', chevron: true },
    { label: 'Fortuna Puntos', icon: 'assets/icons/favorite-database.svg', route: '/home/recargar-puntos', chevron: true },
    { label: 'Pagar', icon: 'assets/icons/HandCoins.svg', route: '/home/pagar', chevron: true },
    { label: 'Reporte de deudas', icon: 'assets/icons/FileLineChart.svg', route: '/home/reportes', chevron: true },
    { label: 'Cerrar Sesión', icon: 'assets/icons/LogOut.svg', action: 'logout', chevron: false },
  ]);

  dashboard = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  canGoMisPrestamos = computed(() => this.dashboard()?.tienePrestamo === '1');

  async ngOnInit() {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    try {
      const data = await this.dashboardSvc.loadMyDashboard();
      this.dashboard.set(data);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo cargar el dashboard');
    } finally {
      this.isLoading.set(false);
    }
  }

  goMisPrestamos() {
    if (this.canGoMisPrestamos()) this.router.navigate(['/home/mis-prestamos']);
  }

  onItemClick(item: MenuItem) {
    if (item.action === 'logout') {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
