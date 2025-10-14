import {Injectable, signal, effect, computed} from '@angular/core';

const TOKEN_KEY    = 'auth_token';
const USER_KEY     = 'auth_user';
const USER_ID_KEY  = 'auth_user_id';

const storage: Storage = localStorage;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _token   = signal<string | null>(storage.getItem(TOKEN_KEY));
  private _usuario = signal<string | null>(storage.getItem(USER_KEY));
  private _userId  = signal<string | null>(storage.getItem(USER_ID_KEY));

  readonly token   = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly userId  = this._userId.asReadonly();
  readonly isAuthenticated = computed(() => {
    const token = this._token();
    return !!token && token.trim().length > 0;
  });

  constructor() {
    effect(() => {
      const t = this._token();
      const u = this._usuario();
      const id = this._userId();

      if (t) storage.setItem(TOKEN_KEY, t); else storage.removeItem(TOKEN_KEY);
      if (u) storage.setItem(USER_KEY, u);  else storage.removeItem(USER_KEY);
      if (id) storage.setItem(USER_ID_KEY, id); else storage.removeItem(USER_ID_KEY);
    });

    window.addEventListener('storage', (ev) => {
      if (ev.key === TOKEN_KEY)    this._token.set(storage.getItem(TOKEN_KEY));
      if (ev.key === USER_KEY)     this._usuario.set(storage.getItem(USER_KEY));
      if (ev.key === USER_ID_KEY)  this._userId.set(storage.getItem(USER_ID_KEY));
      if (ev.key === null) {
        this._token.set(storage.getItem(TOKEN_KEY));
        this._usuario.set(storage.getItem(USER_KEY));
        this._userId.set(storage.getItem(USER_ID_KEY));
      }
    });
  }

  setSession(token: string, usuario: string, userId: string) {
    this._token.set(token);
    this._usuario.set(usuario);
    this._userId.set(userId);
  }

  setToken(token: string | null) {
    this._token.set(token);
  }

  clear() {
    this._token.set(null);
    this._usuario.set(null);
    this._userId.set(null);
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
    storage.removeItem(USER_ID_KEY);
  }
}
