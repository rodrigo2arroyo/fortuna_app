export interface DashboardData {
  puntosDisponibles: number | string;
  puntosGarantia:    number | string;
  puntosActivar:     number | string;
  prestamoEstado:    string;
  prestamoVencimiento?: string;
  tienePrestamo:     '0' | '1';
  prestamo:          unknown | null;
}
