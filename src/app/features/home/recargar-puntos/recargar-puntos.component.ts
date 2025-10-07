import {Component, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {StepCardComponent} from '../../../shared/step-card/step-card.component';

@Component({
  selector: 'app-recargar-puntos',
  imports: [StepCardComponent, RouterLink],
  templateUrl: './recargar-puntos.component.html',
})
export class RecargarPuntosComponent {
  step = signal(0);

  goToStep(n: number) {
    this.step.set(n);
  }
}
