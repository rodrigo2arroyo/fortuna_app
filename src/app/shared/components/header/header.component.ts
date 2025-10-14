import { Component, computed, inject } from '@angular/core';
import { UserStore } from '../../stores/user.store';
import { PuntosStore } from '../../stores/puntos.store';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly userStore   = inject(UserStore);
  private readonly pointsStore = inject(PuntosStore);

  readonly user   = this.userStore.user;
  readonly points = this.pointsStore.puntosDisponibles;

  readonly displayName = computed(() => this.user()?.nombreCompleto ?? '');
  readonly firstLetter = computed(() => {
    const name = this.user()?.nombreCompleto ?? '';
    return name.trim().charAt(0).toUpperCase() || '';
  });

  readonly puntosFmt = computed(() => {
    const val = this.points() ?? 0;
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(val);
  });

  readonly nivel = computed(() => this.user()?.nivel ?? '1');
}
