import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../shared/stores/auth.store';
import { environment } from '../../../../environments/environments';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface PuntosRecargaResponse {
  puntosConfirmados: string;
  nroMovimiento: string;
  fecha: string;
}

export interface GarantizarResponse {
  garantizadaConfirmada: string; // "475"
}

export interface EvaluarResponse {
  cuotaMensual: string;  // "S/ 94.40"
  tea: string;           // "35%"
  tcea: string;          // "19456.79%"
  comision: string;      // "S/ 42.5"
  totalPagar: string;    // "S/ 108.40"
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

  async garantizarPuntos(puntos: number, cuotas: number): Promise<GarantizarResponse> {
    const id = this.authStore.userId();
    if (!id) throw new Error('No hay usuario logeado');

    const url = `${this.BASE}/garantizar`;
    const body = { idUsuario: Number(id), puntos, cuotas };

    try {
      const resp = await firstValueFrom(
        this.http.post<ApiResponse<GarantizarResponse>>(url, body) // JSON
      );

      if (!resp?.data || resp.code !== '0') {
        throw new Error(resp?.message || 'No se pudo garantizar puntos');
      }
      return resp.data;
    } catch (err: any) {
      const backendMsg = err?.error?.message || err?.error?.Message || err?.message;
      throw new Error(backendMsg || 'Error desconocido al garantizar puntos');
    }
  }

  async evaluarPuntos(puntos: number, cuotas: number): Promise<EvaluarResponse> {
    const id = this.authStore.userId();
    if (!id) throw new Error('No hay usuario logeado');

    const url = `${this.BASE}/evaluar`;
    const body = { idUsuario: Number(id), puntos, cuotas };

    try {
      const resp = await firstValueFrom(
        this.http.post<ApiResponse<EvaluarResponse>>(url, body)
      );

      if (!resp?.data || resp.code !== '0') {
        throw new Error(resp?.message || 'No se pudo evaluar el préstamo');
      }
      return resp.data;
    } catch (err: any) {
      const backendMsg = err?.error?.message || err?.error?.Message || err?.message;
      throw new Error(backendMsg || 'Error desconocido al evaluar puntos');
    }
  }
}
