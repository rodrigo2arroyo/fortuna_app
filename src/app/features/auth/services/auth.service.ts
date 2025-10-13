import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TokenStoreService } from '../../../shared/services/toke-store.service';
import { environment } from '../../../../environments/environments';
import { LoginData, LoginRequest } from '../models/auth.model';
import { ApiResponse } from '../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(TokenStoreService);

  private readonly BASE    = environment.apiUrl;
  private readonly LOGIN   = `${this.BASE}/login`;
  private readonly REFRESH = `${this.BASE}/refresh`;

  async login(payload: LoginRequest): Promise<LoginData> {
    const resp = await firstValueFrom(
      this.http.post<ApiResponse<LoginData>>(this.LOGIN, payload)
    );

    if (!resp?.data || resp.code !== '0') {
      throw new Error(resp?.message || 'Error de autenticación');
    }

    this.store.setSession(resp.data.token, payload.usuario, String(resp.data.idUsuario));

    return resp.data;
  }

  async refreshByUser(usuario: string): Promise<LoginData> {
    const body = new HttpParams().set('usuario', usuario);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    const resp = await firstValueFrom(
      this.http.post<ApiResponse<LoginData>>(this.REFRESH, body.toString(), { headers })
    );

    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo refrescar el token');
    this.store.setToken(resp.data.token);
    return resp.data;
  }

  async refreshFromStore(): Promise<LoginData> {
    const u = this.store.usuario();
    if (!u) throw new Error('No hay usuario para refrescar');
    return this.refreshByUser(u);
  }

  logout(): void {
    this.store.clear();
  }
}
