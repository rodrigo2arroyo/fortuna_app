import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../../environments/environments';
import {firstValueFrom} from 'rxjs';
import {ApiResponse} from '../../../shared/models/api-response.model';
import {SmsCodeResponse, UserDniData, UserRegisterRequest, UserRegisterResponse} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/usuario`;
  private readonly serviceHeaders = new HttpHeaders({ 'X-Auth-Mode': 'service' });

  async obtenerDatosPorDni(dni: string): Promise<UserDniData> {
    const url = `${this.BASE}/datos/${dni}`;
    const resp = await firstValueFrom(
      this.http.get<ApiResponse<UserDniData>>(url, { headers: this.serviceHeaders })
    );
    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo obtener datos del DNI');
    return resp.data;
  }

  private async obtenerUbigeo(departamento: string = '-', provincia: string = '-'): Promise<string[]> {
    const url = `${this.BASE}/ubigeo/${departamento}/${provincia}`;
    const resp = await firstValueFrom(
      this.http.get<ApiResponse<string[]>>(url, { headers: this.serviceHeaders })
    );
    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo obtener ubigeo');
    return resp.data;
  }

  async solicitarCodigoSms(dni: string, celular: string): Promise<SmsCodeResponse> {
    const url = `${this.BASE}/solicitar-codigo-sms/${dni}/${celular}`;
    const resp = await firstValueFrom(
      this.http.get<ApiResponse<SmsCodeResponse>>(url, { headers: this.serviceHeaders })
    );
    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo solicitar el código SMS');
    return resp.data;
  }

  async validarCodigoSms(dni: string, codigo: string): Promise<SmsCodeResponse> {
    const url = `${this.BASE}/validar-codigo-sms/${dni}/${codigo}`;
    const resp = await firstValueFrom(
      this.http.get<ApiResponse<SmsCodeResponse>>(url, { headers: this.serviceHeaders })
    );
    if (!resp?.data || resp.code !== '0') throw new Error(resp?.message || 'No se pudo validar el código SMS');
    return resp.data;
  }

  listarDepartamentos(): Promise<string[]> {
    return this.obtenerUbigeo('-', '-');
  }

  listarProvincias(departamento: string): Promise<string[]> {
    return this.obtenerUbigeo(departamento, '-');
  }

  listarDistritos(departamento: string, provincia: string): Promise<string[]> {
    return this.obtenerUbigeo(departamento, provincia);
  }

  async registrarUsuario(payload: UserRegisterRequest): Promise<UserRegisterResponse> {
    const url = `${this.BASE}/registro`;

    try {
      const resp = await firstValueFrom(
        this.http.post<ApiResponse<UserRegisterResponse>>(url, payload, { headers: this.serviceHeaders })
      );

      if (!resp?.data || resp.code !== '0') {
        throw new Error(resp?.message || 'No se pudo registrar el usuario');
      }

      if (resp.data.codigo && resp.data.codigo !== 'OK') {
        throw new Error(resp.data.mensaje || 'No se pudo registrar el usuario');
      }

      return resp.data;

    } catch (err: any) {
      const backendMsg = err?.error?.message || err?.error?.Message || err?.message;
      throw new Error(backendMsg || 'Error desconocido al registrar usuario');
    }
  }
}
