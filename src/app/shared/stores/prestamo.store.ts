import { Injectable, computed, signal } from '@angular/core';
import { DashboardData, Prestamo } from '../../features/home/models/dashboard.models';

const STORAGE_KEY = 'loan_state_v1';

function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

type PersistShape = {
  tienePrestamo: boolean;
  prestamoEstado: string;
  prestamoVencimiento: string | null;
  prestamo: Prestamo | null;
};

@Injectable({ providedIn: 'root' })
export class PrestamoStore {
  private _tienePrestamo       = signal<boolean>(false);
  private _prestamoEstado      = signal<string>('');
  private _prestamoVencimiento = signal<string | null>(null);
  private _prestamo            = signal<Prestamo | null>(null);
  private _hydrated            = signal<boolean>(false);

  readonly tienePrestamo       = this._tienePrestamo.asReadonly();
  readonly prestamoEstado      = this._prestamoEstado.asReadonly();
  readonly prestamoVencimiento = this._prestamoVencimiento.asReadonly();
  readonly prestamo            = this._prestamo.asReadonly();
  readonly hydrated            = this._hydrated.asReadonly();

  readonly montoPorPagar = computed(() => {
    const p = this._prestamo();
    return p ? toNumber(p.capitalPorPagar) : 0;
  });

  constructor() {
    this.rehydrate();
  }

  private persist() {
    const snap: PersistShape = {
      tienePrestamo: this._tienePrestamo(),
      prestamoEstado: this._prestamoEstado(),
      prestamoVencimiento: this._prestamoVencimiento(),
      prestamo: this._prestamo(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  }

  private rehydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistShape;
      this._tienePrestamo.set(parsed.tienePrestamo);
      this._prestamoEstado.set(parsed.prestamoEstado ?? '');
      this._prestamoVencimiento.set(parsed.prestamoVencimiento ?? null);
      this._prestamo.set(parsed.prestamo ?? null);
      this._hydrated.set(true);
    } catch { /* noop */ }
  }

  setFromDashboard(d: Pick<DashboardData,'tienePrestamo'|'prestamoEstado'|'prestamoVencimiento'|'prestamo'>) {
    this._tienePrestamo.set(d.tienePrestamo === '1');
    this._prestamoEstado.set(d.prestamoEstado ?? '');
    this._prestamoVencimiento.set(d.prestamoVencimiento ?? null);
    this._prestamo.set(d.prestamo ?? null);
    this._hydrated.set(true);
    this.persist();
  }

  setPrestamo(p: Prestamo | null) {
    this._prestamo.set(p);
    this._tienePrestamo.set(!!p);
    this._hydrated.set(true);
    this.persist();
  }

  clear() {
    this._tienePrestamo.set(false);
    this._prestamoEstado.set('');
    this._prestamoVencimiento.set(null);
    this._prestamo.set(null);
    this._hydrated.set(false);
    localStorage.removeItem(STORAGE_KEY);
  }
}
