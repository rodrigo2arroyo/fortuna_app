import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StepCardComponent } from '../../../shared/components/step-card/step-card.component';
import { UserStore } from '../../../shared/stores/user.store';
import { PuntosStore } from '../../../shared/stores/puntos.store';
import { FormsModule } from '@angular/forms';

function intFmt(n: number) {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(n);
}

@Component({
  selector: 'app-garantizar-puntos',
  templateUrl: './garantizar-puntos.component.html',
  imports: [
    StepCardComponent,
    RouterLink,
    FormsModule
  ]
})
export class GarantizarPuntosComponent {
  private readonly router = inject(Router);
  private readonly userStore = inject(UserStore);
  private readonly puntosStore = inject(PuntosStore);

  step = 1;

  readonly user = this.userStore.user;
  readonly puntosDisponibles = this.puntosStore.puntosDisponibles;
  readonly puntosGarantia    = this.puntosStore.puntosGarantia;
  readonly puntosActivar     = this.puntosStore.puntosActivar;

  readonly firstName = computed(() => {
    const full = this.user()?.nombreCompleto?.trim() ?? '';
    return full ? full.split(/\s+/)[0] : 'Usuario';
  });

  monto = signal<number>(0);

  readonly dispFmt   = computed(() => intFmt(this.puntosDisponibles() || 0));
  readonly garanFmt  = computed(() => intFmt(this.puntosGarantia() || 0));
  readonly activarFmt= computed(() => intFmt(this.puntosActivar() || 0));

  readonly montoFmtSoles = computed(() => intFmt(this.monto()));
  readonly montoFmtPts   = computed(() => intFmt(this.monto())); // 1 punto = S/1

  onInputMonto(value: string | number) {
    const n = Number(String(value).replace(/[, ]/g, ''));
    this.monto.set(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  nextStep() { if (this.step < 3) this.step++; }
  prevStep() { if (this.step > 1) this.step--; }
  goHome()   { this.router.navigate(['/home']); }
}
