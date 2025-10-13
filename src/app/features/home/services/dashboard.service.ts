import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TokenStoreService } from '../../../shared/services/toke-store.service';
import { environment } from '../../../../environments/environments';
import { DashboardData } from '../models/dashboard.models';
import { ApiResponse } from '../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http  = inject(HttpClient);
  private readonly store = inject(TokenStoreService);

  private readonly BASE = environment.apiUrl;
  private readonly DASHBOARD = `${this.BASE}/dashboard/usuario`;

  async getDashboardByUserId(userId: string | number): Promise<DashboardData> {
    const url = `${this.DASHBOARD}/${userId}`;
    const resp = await firstValueFrom(this.http.get<ApiResponse<DashboardData>>(url));
    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo obtener el dashboard');
    return resp.data;
  }

  async getMyDashboard(): Promise<DashboardData> {
    const id = this.store.userId();
    if (!id) throw new Error('No hay userId en sesión');
    return this.getDashboardByUserId(id);
  }
}
