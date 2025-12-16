import {Injectable, signal} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  token = signal<string | null>(null);

  setToken(t: string) { this.token.set(t); }
  clear() { this.token.set(null); }
}
