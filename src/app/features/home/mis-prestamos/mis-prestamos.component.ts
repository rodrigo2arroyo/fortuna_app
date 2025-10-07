import {Component, computed, signal} from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-mis-prestamos',
  imports: [
    RouterLink
  ],
  templateUrl: './mis-prestamos.component.html',
})
export class MisPrestamosComponent {
  showDetails = signal(false);
  toggleDetails() { this.showDetails.update(v => !v); }
  label = computed(() => this.showDetails() ? 'Ver menos detalles' : 'Ver más detalles');
}
