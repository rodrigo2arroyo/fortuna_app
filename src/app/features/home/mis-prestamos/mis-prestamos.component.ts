import { Component, computed, inject, signal } from '@angular/core';
import { PrestamoStore } from '../../../shared/stores/prestamo.store';
import { RouterLink } from '@angular/router';

function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function money(n: number | string | null | undefined) {
  const val = toNumber(n);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(val);
}

@Component({
  selector: 'app-mis-prestamos',
  templateUrl: './mis-prestamos.component.html',
  imports: [
    RouterLink
  ]
})
export class MisPrestamosComponent {
  private readonly loans = inject(PrestamoStore);

  showDetails = signal(false);
  toggleDetails() { this.showDetails.update(v => !v); }
  label = computed(() => this.showDetails() ? 'Ver menos detalles' : 'Ver más detalles');

  readonly tienePrestamo = this.loans.tienePrestamo;
  readonly prestamo      = this.loans.prestamo;
  readonly estado        = this.loans.prestamoEstado;
  readonly vencimiento   = this.loans.prestamoVencimiento;

  readonly capitalPorPagar = computed(() => money(this.prestamo()?.capitalPorPagar));
  readonly capitalPagado   = computed(() => money(this.prestamo()?.capitalPagado));
  readonly montoInicial    = computed(() => money(this.prestamo()?.montoInicial));
  readonly montoSgtePago   = computed(() => money(this.prestamo()?.montoSgtePago));
  readonly tea             = computed(() => this.prestamo()?.tea ?? '');
  readonly tcea            = computed(() => this.prestamo()?.tcea ?? '');

  readonly cuotasPagadas = computed(() => toNumber(this.prestamo()?.cuotasPagadas));
  readonly plazoCuotas   = computed(() => toNumber(this.prestamo()?.plazoCuotas));

  readonly progresoPct = computed(() => {
    const pag = this.cuotasPagadas();
    const tot = this.plazoCuotas();
    if (!tot) return 0;
    const pct = Math.min(100, Math.max(0, (pag / tot) * 100));
    return Math.round(pct);
  });

  readonly cuotasTexto = computed(() => `${this.cuotasPagadas()} de ${this.plazoCuotas()}`);

  readonly vencimientoSgtePago = computed(() => this.prestamo()?.vencimientoSgtePago ?? this.vencimiento() ?? '');
}
