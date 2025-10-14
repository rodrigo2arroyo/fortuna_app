import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { DashboardData } from '../models/dashboard.models';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { AuthStore } from '../../../shared/stores/auth.store';
import { PuntosStore } from '../../../shared/stores/puntos.store';
import { PrestamoStore } from '../../../shared/stores/prestamo.store';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private readonly pointsStore = inject(PuntosStore);
  private readonly loanStore   = inject(PrestamoStore);

  private readonly BASE      = environment.apiUrl;
  private readonly DASHBOARD = `${this.BASE}/dashboard/usuario`;

  async loadMyDashboard(): Promise<DashboardData> {
    const id = this.auth.userId();
    if (!id) throw new Error('No hay userId en sesión');

    const url = `${this.DASHBOARD}/${id}`;

    const resp = await firstValueFrom(
      this.http.get<ApiResponse<DashboardData>>(url)
    );

    if (!resp?.data || resp.code !== '0') {
      throw new Error(resp?.message || 'No se pudo obtener el dashboard');
    }

    const data = resp.data;

    this.pointsStore.setFromDashboard(data);
    this.loanStore.setFromDashboard(data);

    return data;
  }
}
