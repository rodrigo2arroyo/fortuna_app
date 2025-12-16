import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardData } from '../models/dashboard.models';
import { Skeleton } from 'primeng/skeleton';
import { UserStore } from '../../../shared/stores/user.store';

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
    Skeleton,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly dashboardSvc = inject(DashboardService);
  private readonly userStore   = inject(UserStore);

  readonly user   = this.userStore.user;
  readonly menu = signal<MenuItem[]>([
    { label: 'Inicio', icon: 'assets/icons/Home.svg', route: '/home', chevron: true },
    { label: 'Solicitar préstamo', icon: 'assets/icons/Handshake.svg', route: '/home/solicitar-prestamo', chevron: true },
    { label: 'Fortuna Puntos', icon: 'assets/icons/favorite-database.svg', route: '/home/recargar-puntos', chevron: true },
    { label: 'Pagar', icon: 'assets/icons/HandCoins.svg', route: '/home/pagar', chevron: true },
    { label: 'Reporte de deudas', icon: 'assets/icons/FileLineChart.svg', route: '/home/reportes', chevron: true },
    { label: 'Cerrar Sesión', icon: 'assets/icons/LogOut.svg', action: 'logout', chevron: false },
  ]);

  dashboard = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  estado = computed(() => this.normalize(this.dashboard()?.prestamoEstado));
  showWelcomeModal = signal(false);
  canGoMisPrestamos = computed(() => this.dashboard()?.tienePrestamo === '1');

  async ngOnInit() {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      const data = await this.dashboardSvc.loadMyDashboard();
      this.dashboard.set(data);

      const shouldShowWelcome = localStorage.getItem('fortuna_show_welcome') === '1';
      console.warn(shouldShowWelcome);

      if (shouldShowWelcome) {
        this.showWelcomeModal.set(true);

        localStorage.setItem('fortuna_show_welcome', '0');
      }
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo cargar el dashboard');
    } finally {
      this.isLoading.set(false);
    }
  }


  private normalize = (s?: string) =>
    (s ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  goMisPrestamos() {
    if (this.canGoMisPrestamos()) this.router.navigate(['/home/mis-prestamos']);
  }

  onWelcomeStart() {
    this.showWelcomeModal.set(false);
  }

  estadoMeta = computed(() => {
    switch (this.estado()) {
      case 'no califica':
        return {
          chip: 'bg-red-500 text-white',
          showGuarantee: true
        };
      case 'en ratificacion':
        return {
          chip: 'bg-gray-600 text-white',
          showGuarantee: false
        };
      case 'en desembolso':
        return {
          chip: 'bg-gray-400 text-white',
          showGuarantee: false
        };
      case 'desembolsado':
        return {
          chip: 'bg-amber-500 text-white',
          showGuarantee: false
        };
      case 'vigente':
        return {
          chip: 'bg-white text-emerald-600 border border-emerald-600',
          showGuarantee: false
        };
      case 'vencido':
        return {
          chip: 'bg-white text-red-500 border border-red-500',
          showGuarantee: false
        };
      default:
        return {
          chip: 'bg-gray-300 text-gray-700',
          showGuarantee: false
        };
    }
  });

  onItemClick(item: MenuItem) {
    if (item.action === 'logout') {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }
}
