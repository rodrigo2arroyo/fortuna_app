import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';
const USER_ID_KEY = 'auth_user_id';

@Injectable({ providedIn: 'root' })
export class TokenStoreService {
  private _token   = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _usuario = signal<string | null>(localStorage.getItem(USER_KEY));
  private _userId  = signal<string | null>(localStorage.getItem(USER_ID_KEY));

  token   = this._token.asReadonly();
  usuario = this._usuario.asReadonly();
  userId  = this._userId.asReadonly();

  setSession(token: string, usuario: string, userId: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, usuario);
    localStorage.setItem(USER_ID_KEY, userId);
    this._token.set(token);
    this._usuario.set(usuario);
    this._userId.set(userId);
  }

  setToken(token: string | null) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    this._token.set(token);
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_ID_KEY);
    this._token.set(null);
    this._usuario.set(null);
    this._userId.set(null);
  }
}
