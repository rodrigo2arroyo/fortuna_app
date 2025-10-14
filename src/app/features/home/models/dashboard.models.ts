export interface Prestamo {
  capitalPagado:       number | string;
  capitalPorPagar:     number | string;
  cuotasPagadas:       number | string;
  deudaTotalAtrasada:  number | string;
  montoInicial:        number | string;
  montoLiquidar:       number | string;
  montoPrestamo:       number | string;
  montoSgtePago:       number | string;
  plazoCuotas:         number | string;
  tcea:                string;
  tea:                 string;
  vencimientoSgtePago: string;
}

export interface DashboardData {
  puntosDisponibles:   number | string;
  puntosGarantia:      number | string;
  puntosActivar:       number | string;
  prestamoEstado:      string;
  prestamoVencimiento?: string;
  tienePrestamo:       '0' | '1';
  prestamo:            Prestamo | null;
}
