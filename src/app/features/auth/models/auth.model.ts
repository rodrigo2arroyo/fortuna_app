export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginData {
  idUsuario: string;
  nombreCompleto: string;
  token: string;
}

export interface RefreshRequest {
  usuario: string;
}
