import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../environments/environments';
import {LoginData, LoginRequest} from '../models/auth.model';
import {ApiResponse} from '../../../shared/models/api-response.model';
import {AuthStore} from '../../../shared/stores/auth.store';
import {UserStore} from '../../../shared/stores/user.store';
import {PrestamoStore} from '../../../shared/stores/prestamo.store';
import {PuntosStore} from '../../../shared/stores/puntos.store';
import {AuthStoreService} from './auth.store.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly userStore = inject(UserStore);
  private readonly puntosStore = inject(PuntosStore);
  private readonly prestamoStore = inject(PrestamoStore);
  private readonly authStoreService = inject(AuthStoreService);
  private serviceLoginInFlight: Promise<string> | null = null;

  private readonly BASE    = environment.apiUrl;
  private readonly LOGIN   = `${this.BASE}/login`;
  private readonly REFRESH = `${this.BASE}/refresh`;

  async login(payload: LoginRequest): Promise<LoginData> {
    const body = new HttpParams()
      .set('usuario', payload.usuario)
      .set('password', payload.password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    const resp = await firstValueFrom(
      this.http.post<ApiResponse<LoginData>>(this.LOGIN, body.toString(), { headers })
    );

    if (!resp?.data || resp.code !== '0') {
      throw new Error(resp?.message || 'Error de autenticación');
    }

    this.authStore.setSession(
      resp.data.token,
      payload.usuario,
      String(resp.data.idUsuario)
    );

    this.userStore.setUser({
      id: String(resp.data.idUsuario),
      nombreCompleto: resp.data.nombreCompleto,
      nivel: '1',
    });

    return resp.data;
  }


  async refreshByUser(usuario: string): Promise<LoginData> {
    const body = new HttpParams().set('usuario', usuario);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    const resp = await firstValueFrom(
      this.http.post<ApiResponse<LoginData>>(this.REFRESH, body.toString(), { headers })
    );

    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo refrescar el token');
    this.authStore.setToken(resp.data.token);
    return resp.data;
  }

  async refreshFromStore(): Promise<LoginData> {
    const u = this.authStore.usuario();
    if (!u) throw new Error('No hay usuario para refrescar');
    return this.refreshByUser(u);
  }

  async loginAsServiceAdmin(): Promise<string> {
    const body = new HttpParams()
      .set('usuario', 'admin.fortuna')
      .set('password', 'Fortun@dmin$$');

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    const resp = await firstValueFrom(
      this.http.post<ApiResponse<LoginData>>(this.LOGIN, body.toString(), { headers })
    );

    if (!resp?.data || resp.code !== '0') {
      throw new Error(resp?.message || 'Error autenticando admin');
    }

    this.authStoreService.setToken(resp.data.token);

    return resp.data.token;
  }

  async getServiceToken(): Promise<string> {
    const existing = this.authStoreService.token();
    if (existing) return existing;

    if (this.serviceLoginInFlight) return this.serviceLoginInFlight;

    this.serviceLoginInFlight = (async () => {
      return await this.loginAsServiceAdmin();
    })();

    try {
      return await this.serviceLoginInFlight;
    } finally {
      this.serviceLoginInFlight = null;
    }
  }

  logout(): void {
    this.authStore.clear();
    this.userStore.clear();
    this.puntosStore.clear();
    this.prestamoStore.clear();
  }
}
