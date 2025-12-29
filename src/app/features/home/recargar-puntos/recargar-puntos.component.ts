import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environments';
import { PuntosService } from '../services/puntos.service';
import { StepCardComponent } from '../../../shared/components/step-card/step-card.component';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-recargar-puntos',
  standalone: true,
  imports: [FormsModule, StepCardComponent, RouterLink, DecimalPipe],
  templateUrl: './recargar-puntos.component.html',
})
export class RecargarPuntosComponent {
  step = signal(0);
  monto = signal<number>(500);
  isLoading = signal(false);
  errorMsg  = signal<string | null>(null);
  COMISION = signal<number>(0.13);

  nroMovimiento = signal<string | null>(null);
  fechaMovimiento = signal<string | null>(null);

  numeroCuentaInterbank = environment.numeroCuentaInterbank;
  numeroCuentaInterbancarioInterbank = environment.numeroCuentaInterbancarioInterbank;
  titularCuentaInterbank = environment.titularCuentaInterbank;

  private readonly puntosSvc = inject(PuntosService);

  goToStep(n: number) {
    this.step.set(n);
  }

  async confirmarRecarga() {
    this.errorMsg.set(null);
    this.isLoading.set(true);

    try {
      const m = Math.max(350, Math.min(3000, Number(this.monto()) || 0));

      const resp = await this.puntosSvc.recargarPuntos(m);
      this.nroMovimiento.set(resp.nroMovimiento);
      this.fechaMovimiento.set(resp.fecha);

      this.step.set(2);
    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo recargar puntos');
    } finally {
      this.isLoading.set(false);
    }
  }
}
