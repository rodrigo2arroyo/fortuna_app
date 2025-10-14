import {Component, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {StepCardComponent} from '../../../shared/components/step-card/step-card.component';
import {environment} from '../../../../environments/environments';

@Component({
  selector: 'app-recargar-puntos',
  imports: [StepCardComponent, RouterLink],
  templateUrl: './recargar-puntos.component.html',
})
export class RecargarPuntosComponent {
  step = signal(0);
  numeroCuentaInterbank = environment.numeroCuentaInterbank;
  numeroCuentaInterbancarioInterbank = environment.numeroCuentaInterbancarioInterbank;
  titularCuentaInterbank = environment.titularCuentaInterbank;

  goToStep(n: number) {
    this.step.set(n);
  }
}
