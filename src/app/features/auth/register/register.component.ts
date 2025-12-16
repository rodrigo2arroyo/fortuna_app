import {Component, computed, inject, OnDestroy, OnInit, signal, WritableSignal} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { formatCountdown } from './utils/time-format.utils';
import { buildOtpForm, getOtpCode } from './utils/otp.util';
import { CELULAR_REGEX, DNI_REGEX } from './utils/validators.const';
import { passwordsMatchValidator } from '../../../shared/form-validators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UserRegisterRequest } from '../models/user.model';

type Step = 'identidad' | 'datos' | 'verificacion' | 'credenciales';
const STEPS: Step[] = ['identidad', 'datos', 'verificacion', 'credenciales'];

@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  step = signal<Step>('identidad');
  dni = signal('');
  accepted = signal(false);

  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  loadingDni = signal(false);
  dniError = signal<string | null>(null);

  loadingSms = signal(false);
  smsError = signal<string | null>(null);

  verifyingOtp = signal(false);
  resendingOtp = signal(false);
  otpError = signal<string | null>(null);

  showPassword = signal(false);
  showPasswordConfirm = signal(false);

  countdown = signal(190);
  private countdownId?: number;

  departamentos = signal<string[]>([]);
  provincias = signal<string[]>([]);
  distritos = signal<string[]>([]);

  loadingDep = signal(false);
  loadingProv = signal(false);
  loadingDist = signal(false);
  ubigeoError = signal<string | null>(null);

  datosForm = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    celular: ['', [Validators.required, Validators.pattern(CELULAR_REGEX)]],
    correo: ['', [Validators.required, Validators.email]],
    ingresoMensual: [null, [Validators.required, Validators.min(1300)]],
    empresaTrabajo: ['', Validators.required],
    ocupacion: ['', Validators.required],
    estadoCivil: ['', Validators.required],
    gradoInstruccion: ['', Validators.required],
    diaPago: ['', Validators.required],
    comoConociste: ['', Validators.required],
    departamentoDni: ['', Validators.required],
    provinciaDni: ['', Validators.required],
    distritoDni: ['', Validators.required],
    domicilioDni: ['', Validators.required],
  });

  credencialesForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', Validators.required],
    },
    { validators: passwordsMatchValidator() }
  );

  otpForm = buildOtpForm(this.fb);

  stepIndex = computed(() => STEPS.indexOf(this.step()));
  dniValid = computed(() => DNI_REGEX.test(this.dni().trim()));
  countdownText = computed(() => formatCountdown(this.countdown()));

  passwordMismatch = computed(
    () =>
      this.credencialesForm.hasError('passwordMismatch') &&
      this.credencialesForm.get('passwordConfirm')?.touched
  );

  get otpCode(): string {
    return getOtpCode(this.otpForm.value);
  }

  get otpValid(): boolean {
    return this.otpCode.length === 6 && this.otpForm.valid;
  }

  get celularMasked(): string {
    const value = String(this.datosForm.get('celular')?.value || '');
    return value.length < 2 ? '***' : `***${value.slice(-2)}`;
  }

  ngOnInit() {
    this.startCountdown();
    this.cargarDepartamentos();
  }

  ngOnDestroy() {
    if (this.countdownId) clearInterval(this.countdownId);
  }

  async next() {
    if (this.step() === 'identidad') await this.handleIdentidad();
    if (this.step() === 'datos') await this.handleDatos();
    if (this.step() === 'verificacion' && !this.otpValid) return;

    this.step.set(STEPS[Math.min(this.stepIndex() + 1, STEPS.length - 1)]);
  }

  prev() {
    this.step.set(STEPS[Math.max(this.stepIndex() - 1, 0)]);
  }

  goBackToLogin() {
    this.router.navigate(['/auth/login']);
  }

  async resendCode() {
    if (this.countdown() > 0) return;

    this.resendingOtp.set(true);
    this.otpError.set(null);

    try {
      await this.sendSms();
      this.otpForm.reset({ d1:'', d2:'', d3:'', d4:'', d5:'', d6:'' });
      this.startCountdown();
    } catch (e: any) {
      this.otpError.set(e?.message || 'No se pudo reenviar el código');
    } finally {
      this.resendingOtp.set(false);
    }
  }

  onOtpInput(
    event: Event,
    next?: HTMLInputElement | null,
    prev?: HTMLInputElement | null
  ) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 1);
    input.value = value;

    if (value && next) {
      next.focus();
    } else if (!value && prev) {
      prev.focus();
    }
  }

  async verifyAndCreate() {
    if (!this.otpValid) return;

    this.verifyingOtp.set(true);
    this.otpError.set(null);

    try {
      await this.userService.validarCodigoSms(this.dniValue, this.otpCode);
      await this.next();
    } catch (e: any) {
      this.otpError.set(e?.message || 'No se pudo validar el código');
    } finally {
      this.verifyingOtp.set(false);
    }
  }

  async finish() {
    this.datosForm.markAllAsTouched();
    this.credencialesForm.markAllAsTouched();
    if (this.datosForm.invalid || this.credencialesForm.invalid) return;

    const payload = this.buildRegisterPayload();
    const password = payload.password;

    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      await this.userService.registrarUsuario(payload);
      await this.auth.login({ usuario: payload.dni, password });
      localStorage.setItem('fortuna_show_welcome', '1');
      await this.router.navigate(['/home']);
    } catch (e: any) {
      this.errorMsg.set(e?.message || 'No se pudo completar el registro');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDepartamentoChange(dep: string) {
    this.resetUbigeo('provinciaDni', dep);
    if (!dep) return;

    await this.loadUbigeo(
      () => this.userService.listarProvincias(dep),
      this.provincias,
      this.loadingProv
    );
  }

  async onProvinciaChange(prov: string) {
    const dep = this.datosForm.get('departamentoDni')?.value;
    this.resetUbigeo('distritoDni', prov);
    if (!dep || !prov) return;

    await this.loadUbigeo(
      () => this.userService.listarDistritos(dep, prov),
      this.distritos,
      this.loadingDist
    );
  }

  onDistritoChange(dist: string) {
    this.datosForm.patchValue({ distritoDni: dist });
  }

  private async cargarDepartamentos() {
    await this.loadUbigeo(
      () => this.userService.listarDepartamentos(),
      this.departamentos,
      this.loadingDep
    );
  }

  private async handleIdentidad() {
    if (!this.dniValid() || !this.accepted()) return;

    this.loadingDni.set(true);
    this.dniError.set(null);

    try {
      const data = await this.userService.obtenerDatosPorDni(this.dniValue);
      this.datosForm.patchValue({ nombres: data.nombres, apellidos: data.apellidos });
    } catch (e: any) {
      this.dniError.set(e?.message || 'No se pudo validar el DNI');
      throw e;
    } finally {
      this.loadingDni.set(false);
    }
  }

  private async handleDatos() {
    if (this.datosForm.invalid) {
      this.datosForm.markAllAsTouched();
      return;
    }

    this.loadingSms.set(true);
    this.smsError.set(null);

    try {
      await this.sendSms();
    } catch (e: any) {
      this.smsError.set(e?.message || 'No se pudo enviar el código SMS');
      throw e;
    } finally {
      this.loadingSms.set(false);
    }
  }

  private async sendSms() {
    const celular = this.celularValue;
    if (!celular) throw new Error('Ingresa un número de celular');

    const resp = await this.userService.solicitarCodigoSms(this.dniValue, celular);
    if (resp?.codigo && resp.codigo !== '0') {
      throw new Error(resp.mensaje || 'Error enviando SMS');
    }
  }

  private async loadUbigeo(
    fetcher: () => Promise<string[]>,
    target: WritableSignal<string[]>,
    loading: WritableSignal<boolean>
  ) {
    loading.set(true);
    this.ubigeoError.set(null);

    try {
      target.set(await fetcher());
    } catch (e: any) {
      this.ubigeoError.set(e?.message || 'Error cargando datos');
    } finally {
      loading.set(false);
    }
  }

  private resetUbigeo(control: string, value: string) {
    this.datosForm.patchValue({ [control]: value });
    if (control === 'provinciaDni') this.distritos.set([]);
    if (control === 'departamentoDni') {
      this.provincias.set([]);
      this.distritos.set([]);
    }
  }

  private startCountdown() {
    if (this.countdownId) clearInterval(this.countdownId);
    this.countdown.set(190);

    this.countdownId = window.setInterval(() => {
      const v = this.countdown();
      this.countdown.set(v <= 1 ? 0 : v - 1);
      if (v <= 1 && this.countdownId) clearInterval(this.countdownId);
    }, 1000);
  }

  private buildRegisterPayload(): UserRegisterRequest {
    const v = this.datosForm.getRawValue();

    return {
      dni: this.dniValue,
      nombres: v.nombres ?? '',
      apellidos: v.apellidos ?? '',
      empresa: v.empresaTrabajo ?? '',
      ingresoMensual: Number(v.ingresoMensual ?? 0),
      ocupacion: v.ocupacion ?? '',
      estadoCivil: v.estadoCivil ?? '',
      gradoInstruccion: v.gradoInstruccion ?? '',
      diaCuota: Number(v.diaPago ?? 0),
      celular: String(v.celular ?? ''),
      correo: v.correo ?? '',
      comoConociste: v.comoConociste ?? '',
      departamento: v.departamentoDni ?? '',
      provincia: v.provinciaDni ?? '',
      distrito: v.distritoDni ?? '',
      domicilio: v.domicilioDni ?? '',
      password: String(this.credencialesForm.get('password')?.value ?? '').trim(),
    };
  }

  private get dniValue(): string {
    return this.dni().trim();
  }

  private get celularValue(): string {
    return String(this.datosForm.get('celular')?.value || '').trim();
  }
}
