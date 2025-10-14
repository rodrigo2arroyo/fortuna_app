import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  id?: string;
  nombreCompleto: string;
  nivel?: string;
  email?: string;
  avatar?: string;
}

const USER_KEY = 'user_profile_v1';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private _user = signal<UserProfile | null>(this.rehydrate());

  readonly user = this._user.asReadonly();

  constructor() {
    window.addEventListener('storage', (e) => {
      if (e.key === USER_KEY) {
        this._user.set(this.rehydrate());
      }
    });
  }

  private rehydrate(): UserProfile | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }

  setUser(data: UserProfile) {
    this._user.set(data);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  }

  patchUser(partial: Partial<UserProfile>) {
    const current = this._user();
    const merged = { ...current, ...partial } as UserProfile;
    this._user.set(merged);
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  clear() {
    this._user.set(null);
    localStorage.removeItem(USER_KEY);
  }
}
