import {Component, inject, signal} from '@angular/core';
import { Router, RouterLink} from '@angular/router';
import {StepCardComponent} from '../../../shared/components/step-card/step-card.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-solicitar-prestamo',
  imports: [
    RouterLink,
    StepCardComponent,
    FormsModule
  ],
  templateUrl: './solicitar-prestamo.component.html',
})
export class SolicitarPrestamoComponent {
  private readonly router = inject(Router);

  step = signal(1);

  amount = signal<number>(0);

  cuotas = signal<string>('1 cuota');
  diaPago = signal<string>('');
  tipoCuota = signal<string>('Quincenal');
  fechaPrimeraCuota = signal<string>('11/12/2025');

  decreaseAmount() {
    this.amount.update(v => Math.max(0, v - 1));
  }

  increaseAmount() {
    this.amount.update(v => v + 1);
  }

  onAmountInput(value: string | number) {
    const n = Number(value);
    this.amount.set(!Number.isNaN(n) && n >= 0 ? n : 0);
  }

  goToStep(target: number) {
    if (target === 2 && this.amount() <= 0) return;
    if (target < 1 || target > 4) return;
    this.step.set(target);
  }

  updateCuotas(value: string) {
    this.cuotas.set(value);
  }

  updateDiaPago(value: string) {
    this.diaPago.set(value);
  }

  updateTipoCuota(value: string) {
    this.tipoCuota.set(value);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
