import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../shared/stores/auth.store';
import { environment } from '../../../../environments/environments';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface PuntosRecargaResponse {
  puntosConfirmados: string;
}

@Injectable({ providedIn: 'root' })
export class PuntosService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly BASE = `${environment.apiUrl}/puntos`;

  async recargarPuntos(monto: number): Promise<PuntosRecargaResponse> {
    const id = this.authStore.userId();
    if (!id) throw new Error('No hay usuario logeado');

    const url = `${this.BASE}/recargar/${id}/${monto}`;

    try {
      const resp = await firstValueFrom(
        this.http.get<ApiResponse<PuntosRecargaResponse>>(url)
      );

      if (!resp?.data || resp.code !== '0') {
        throw new Error(resp?.message || 'No se pudo recargar puntos');
      }

      return resp.data;
    } catch (err: any) {
      const backendMsg = err?.error?.message || err?.error?.Message || err?.message;
      throw new Error(backendMsg || 'Error desconocido al recargar puntos');
    }
  }
}
