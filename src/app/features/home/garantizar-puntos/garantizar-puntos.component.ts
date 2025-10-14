import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {StepCardComponent} from '../../../shared/components/step-card/step-card.component';

@Component({
  selector: 'app-garantizar-puntos',
  imports: [
    RouterLink,
    StepCardComponent
  ],
  templateUrl: './garantizar-puntos.component.html',
})
export class GarantizarPuntosComponent {
  private readonly router = inject(Router);
  step = 1;

  puntosDisponibles = 475;
  garantiaPts = 475;
  montoSolicitado = 475;

  nextStep() {
    if (this.step < 3) this.step++;
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
