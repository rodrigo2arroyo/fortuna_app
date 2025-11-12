import {Component, computed, signal} from '@angular/core';
import {RouterLink} from '@angular/router';

type Step = 'identidad' | 'datos' | 'verificacion' | 'credenciales';
const steps: Step[] = ['identidad', 'datos', 'verificacion', 'credenciales'];

@Component({
  selector: 'app-register',
  imports: [
    RouterLink
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  step = signal<Step>('identidad');
  stepIndex = computed(() => steps.indexOf(this.step()));

  next() { this.step.set(steps[Math.min(this.stepIndex() + 1, steps.length - 1)]); }
  prev() { this.step.set(steps[Math.max(this.stepIndex() - 1, 0)]); }

  finish() {
    // TODO: submit final payload
  }
}
