import {Component, computed, inject, signal} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StepCardComponent } from '../../../shared/components/step-card/step-card.component';
import { UserStore } from '../../../shared/stores/user.store';
import { PuntosStore } from '../../../shared/stores/puntos.store';
import { FormsModule } from '@angular/forms';
import { EvaluarResponse, PuntosService } from '../services/puntos.service';
import { Skeleton } from 'primeng/skeleton';

function intFmt(n: number) {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(n);
}

@Component({
  selector: 'app-garantizar-puntos',
  templateUrl: './garantizar-puntos.component.html',
  imports: [
    StepCardComponent,
    RouterLink,
    FormsModule,
    Skeleton
  ]
})
export class GarantizarPuntosComponent {
  private readonly router = inject(Router);
  private readonly userStore = inject(UserStore);
  private readonly puntosStore = inject(PuntosStore);
  private readonly puntosSvc = inject(PuntosService);

  step = 1;

  readonly user = this.userStore.user;
  readonly puntosDisponibles = this.puntosStore.puntosDisponibles;
  readonly puntosGarantia    = this.puntosStore.puntosGarantia;
  readonly puntosActivar     = this.puntosStore.puntosActivar;

  readonly firstName = computed(() => {
    const full = this.user()?.nombreCompleto?.trim() ?? '';
    return full ? full.split(/\s+/)[0] : 'Usuario';
  });

  monto  = signal<number>(0);
  montoView: number | '' = '';
  cuotas = signal<number>(1);
  maxDisponibles = computed(() => Number(this.puntosDisponibles() || 0));
  isMontoValid   = computed(() => this.monto() > 0 && this.monto() <= this.maxDisponibles());
  diaPago = signal<number | null>(null);

  isEvalLoading = signal(false);
  isConfLoading = signal(false);
  errorMsg      = signal<string | null>(null);
  evalData      = signal<EvaluarResponse | null>(null);

  readonly dispFmt    = computed(() => intFmt(this.puntosDisponibles() || 0));
  readonly garanFmt   = computed(() => intFmt(this.puntosGarantia() || 0));
  readonly activarFmt = computed(() => intFmt(this.puntosActivar() || 0));
  readonly montoFmtSoles = computed(() => intFmt(this.monto()));
  readonly montoFmtPts   = computed(() => intFmt(this.monto()));
  readonly diasPago = [1, 2, 3, 4, 5, 10, 11, 15, 16, 25, 26, 27, 28, 29, 30];

  onInputMonto(value: string | number | null) {
    if (value === '' || value === null) {
      this.montoView = '';
      return;
    }
    const n = Number(String(value).replace(/[, ]/g, ''));
    const clamped = Number.isFinite(n) ? Math.max(0, n) : 0;
    this.montoView = clamped;
    this.monto.set(clamped);
    if (this.step >= 2) this.evaluar();
  }

  onCuotasChange(v: number) {
    this.cuotas.set(v);
    if (this.diaPago()) {
      this.evaluar();
    }
  }

  onDiaPagoChange(v: number | null) {
    this.diaPago.set(v);

    if (v) {
      this.evaluar();
    } else {
      this.evalData.set(null);
    }
  }

  async evaluar() {
    if (!this.diaPago()) {
      this.evalData.set(null);
      return;
    }

    this.errorMsg.set(null);
    this.isEvalLoading.set(true);

    try {
      const puntos = this.monto();
      const cuotas = this.cuotas();
      const diaPago = this.diaPago()!;

      const data = await this.puntosSvc.evaluarPuntos(puntos, cuotas, diaPago);

      this.evalData.set(data);
    } catch (e: any) {
      this.evalData.set(null);
      this.errorMsg.set(e?.message ?? 'No se pudo evaluar el préstamo');
    } finally {
      this.isEvalLoading.set(false);
    }
  }

  async confirmar() {
    if (!this.diaPago()) return;

    this.errorMsg.set(null);
    this.isConfLoading.set(true);

    try {
      await this.puntosSvc.garantizarPuntos(this.monto(), this.cuotas(), this.diaPago()!);

      this.nextStep();
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo confirmar la garantía');
    } finally {
      this.isConfLoading.set(false);
    }
  }

  nextStep() {
    if (this.step < 3) {
      this.step++;
    }
  }
  prevStep() { if (this.step > 1) this.step--; }
  goHome()   { this.router.navigate(['/home']); }

  onConfirmMonto() {
    if (!this.isMontoValid()) return;
    this.nextStep();
  }
}
