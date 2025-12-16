export interface UserDniData {
  dni: string;
  nombres: string;
  apellidos: string;
}

export interface SmsCodeResponse {
  codigo: string;
  mensaje: string;
}

export interface UserRegisterRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  empresa: string;
  ingresoMensual: number;
  ocupacion: string;
  estadoCivil: string;
  gradoInstruccion: string;
  diaCuota: number;
  celular: string;
  correo: string;
  comoConociste: string;
  departamento: string;
  provincia: string;
  distrito: string;
  domicilio: string;
  password: string;
}

export interface UserRegisterResponse {
  codigo: string;
  mensaje: string;
}
