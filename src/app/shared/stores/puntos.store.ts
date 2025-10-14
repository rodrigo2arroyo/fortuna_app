import { Injectable, computed, signal } from '@angular/core';
import { DashboardData } from '../../features/home/models/dashboard.models';

const STORAGE_KEY = 'points_state_v1';

function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

type PersistShape = {
  puntosDisponibles: number;
  puntosGarantia: number;
  puntosActivar: number;
};

@Injectable({ providedIn: 'root' })
export class PuntosStore {
  private _puntosDisponibles = signal<number>(0);
  private _puntosGarantia    = signal<number>(0);
  private _puntosActivar     = signal<number>(0);
  private _hydrated          = signal<boolean>(false);

  readonly puntosDisponibles = this._puntosDisponibles.asReadonly();
  readonly puntosGarantia    = this._puntosGarantia.asReadonly();
  readonly puntosActivar     = this._puntosActivar.asReadonly();
  readonly hydrated          = this._hydrated.asReadonly();

  readonly totalPuntos = computed(() =>
    this._puntosDisponibles() + this._puntosGarantia() + this._puntosActivar()
  );

  constructor() {
    this.rehydrate();
  }

  private persist() {
    const snap: PersistShape = {
      puntosDisponibles: this._puntosDisponibles(),
      puntosGarantia:    this._puntosGarantia(),
      puntosActivar:     this._puntosActivar(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  }

  private rehydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistShape;
      this._puntosDisponibles.set(parsed.puntosDisponibles ?? 0);
      this._puntosGarantia.set(parsed.puntosGarantia ?? 0);
      this._puntosActivar.set(parsed.puntosActivar ?? 0);
      this._hydrated.set(true);
    } catch {}
  }

  setFromDashboard(d: Pick<DashboardData,'puntosDisponibles'|'puntosGarantia'|'puntosActivar'>) {
    this._puntosDisponibles.set(toNumber(d.puntosDisponibles));
    this._puntosGarantia.set(toNumber(d.puntosGarantia));
    this._puntosActivar.set(toNumber(d.puntosActivar));
    this._hydrated.set(true);
    this.persist();
  }

  patch(partial: Partial<{ puntosDisponibles: number | string; puntosGarantia: number | string; puntosActivar: number | string }>) {
    if (partial.puntosDisponibles !== undefined) this._puntosDisponibles.set(toNumber(partial.puntosDisponibles));
    if (partial.puntosGarantia    !== undefined) this._puntosGarantia.set(toNumber(partial.puntosGarantia));
    if (partial.puntosActivar     !== undefined) this._puntosActivar.set(toNumber(partial.puntosActivar));
    this._hydrated.set(true);
    this.persist();
  }

  clear() {
    this._puntosDisponibles.set(0);
    this._puntosGarantia.set(0);
    this._puntosActivar.set(0);
    this._hydrated.set(false);
    localStorage.removeItem(STORAGE_KEY);
  }
}
