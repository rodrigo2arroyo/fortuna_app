import { Component, computed, inject, signal } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import { LoginRequest } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  dni       = signal<string>('');
  password  = signal<string>('');
  showPass  = signal<boolean>(false);

  isLoading = signal<boolean>(false);
  errorMsg  = signal<string | null>(null);

  dniValid  = computed(() => /^\d{8}$/.test(this.dni().trim()));
  passValid = computed(() => this.password().trim().length >= 6);
  canSubmit = computed(() => this.dniValid() && this.passValid() && !this.isLoading());

  async onLogin() {
    if (!this.canSubmit()) return;
    this.isLoading.set(true);
    this.errorMsg.set(null);
    try {
      const payload: LoginRequest = {
        usuario: this.dni().trim(),
        password: this.password(),
      };
      await this.auth.login(payload);
      await this.router.navigate(['/home']);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }
}
