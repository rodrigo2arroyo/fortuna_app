import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { formatCountdown } from './utils/time-format.utils';
import { buildOtpForm, getOtpCode } from './utils/otp.util';
import { CELULAR_REGEX, DNI_REGEX } from './utils/validators.const';
import { passwordsMatchValidator } from '../../../shared/form-validators';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/auth.model';
import { UserService } from '../services/user.service';

type Step = 'identidad' | 'datos' | 'verificacion' | 'credenciales';
const steps: Step[] = ['identidad', 'datos', 'verificacion', 'credenciales'];

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly userService   = inject(UserService);

  step = signal<Step>('identidad');
  dni = signal<string>('');
  accepted = signal<boolean>(false);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  loadingDni = signal(false);
  dniError = signal<string | null>(null);

  showPassword = signal(false);
  showPasswordConfirm = signal(false);

  loadingSms = signal(false);
  smsError = signal<string | null>(null);

  countdown = signal(190);
  private countdownId: any;
  verifyingOtp = signal(false);
  resendingOtp = signal(false);
  otpError = signal<string | null>(null);

  datosForm: FormGroup = this.fb.group({
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

  get celularMasked(): string {
    const celular = String(this.datosForm.get('celular')?.value || '');

    if (celular.length < 2) return '***';

    const last2 = celular.slice(-2);
    return `***${last2}`;
  }

  credencialesForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
    },
    {
      validators: passwordsMatchValidator(),
    }
  );

  otpForm: FormGroup = buildOtpForm(this.fb);

  stepIndex = computed(() => steps.indexOf(this.step()));

  dniValid = computed(() => DNI_REGEX.test(this.dni().trim()));

  passwordMismatch = computed(
    () =>
      this.credencialesForm.hasError('passwordMismatch') &&
      !!this.credencialesForm.get('passwordConfirm')?.touched
  );

  credencialesValid = computed(
    () =>
      !!this.credencialesForm.get('password')?.valid &&
      !!this.credencialesForm.get('passwordConfirm')?.valid &&
      !this.passwordMismatch()
  );

  get otpCode(): string {
    return getOtpCode(this.otpForm.value);
  }

  get otpValid(): boolean {
    return this.otpCode.length === 6 && this.otpForm.valid;
  }

  countdownText = computed(() => formatCountdown(this.countdown()));

  departamentos = signal<string[]>([]);
  provincias = signal<string[]>([]);
  distritos = signal<string[]>([]);

  loadingDep = signal(false);
  loadingProv = signal(false);
  loadingDist = signal(false);

  ubigeoError = signal<string | null>(null);

  async ngOnInit() {
    this.startCountdown();
    await this.cargarDepartamentos();
  }

  private async cargarDepartamentos() {
    this.loadingDep.set(true);
    this.ubigeoError.set(null);

    try {
      const deps = await this.userService.listarDepartamentos();
      this.departamentos.set(deps);
    } catch (e: any) {
      this.ubigeoError.set(e?.message || 'Error cargando departamentos');
    } finally {
      this.loadingDep.set(false);
    }
  }

  async onDepartamentoChange(dep: string) {
    // set form value
    this.datosForm.patchValue({
      departamentoDni: dep,
      provinciaDni: '',
      distritoDni: '',
    });

    // reset listas
    this.provincias.set([]);
    this.distritos.set([]);

    if (!dep) return;

    this.loadingProv.set(true);
    this.ubigeoError.set(null);

    try {
      const provs = await this.userService.listarProvincias(dep);
      this.provincias.set(provs);
    } catch (e: any) {
      this.ubigeoError.set(e?.message || 'Error cargando provincias');
    } finally {
      this.loadingProv.set(false);
    }
  }

  async onProvinciaChange(prov: string) {
    const dep = this.datosForm.get('departamentoDni')?.value as string;

    this.datosForm.patchValue({
      provinciaDni: prov,
      distritoDni: '',
    });

    this.distritos.set([]);
    if (!dep || !prov) return;

    this.loadingDist.set(true);
    this.ubigeoError.set(null);

    try {
      const dists = await this.userService.listarDistritos(dep, prov);
      this.distritos.set(dists);
    } catch (e: any) {
      this.ubigeoError.set(e?.message || 'Error cargando distritos');
    } finally {
      this.loadingDist.set(false);
    }
  }

  onDistritoChange(dist: string) {
    this.datosForm.patchValue({ distritoDni: dist });
  }

  ngOnDestroy(): void {
    if (this.countdownId) clearInterval(this.countdownId);
  }

  async next() {
    const current = this.step();

    if (current === 'identidad') {
      if (!this.dniValid() || !this.accepted()) return;

      this.dniError.set(null);
      this.loadingDni.set(true);

      try {
        const dni = this.dni().trim();
        const data = await this.userService.obtenerDatosPorDni(dni);

        this.datosForm.patchValue({
          nombres: data.nombres,
          apellidos: data.apellidos,
        });
      } catch (e: any) {
        this.dniError.set(e?.message || 'No se pudo validar el DNI');
        return;
      } finally {
        this.loadingDni.set(false);
      }
    }

    if (current === 'datos') {
      if (this.datosForm.invalid) {
        this.datosForm.markAllAsTouched();
        return;
      }

      const dni = this.dni().trim();
      const celular = String(this.datosForm.get('celular')?.value || '').trim();

      if (!celular) {
        this.smsError.set('Ingresa un número de celular');
        return;
      }

      this.smsError.set(null);
      this.loadingSms.set(true);

      try {
        const resp = await this.userService.solicitarCodigoSms(dni, celular);
        if (resp?.codigo && resp.codigo !== '0') {
          throw new Error(resp.mensaje || 'No se pudo enviar el código SMS');
        }

      } catch (e: any) {
        this.smsError.set(e?.message || 'No se pudo enviar el código SMS');
        return;
      } finally {
        this.loadingSms.set(false);
      }
    }

    if (current === 'verificacion') {
      if (!this.otpValid) return;
    }

    this.step.set(steps[Math.min(this.stepIndex() + 1, steps.length - 1)]);
  }

  prev() {
    this.step.set(steps[Math.max(this.stepIndex() - 1, 0)]);
  }

  goBackToLogin() {
    this.router.navigate(['/auth/login']);
  }

  private startCountdown() {
    if (this.countdownId) clearInterval(this.countdownId);
    this.countdown.set(190);
    this.countdownId = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        clearInterval(this.countdownId);
        return;
      }
      this.countdown.set(current - 1);
    }, 1000);
  }

  async resendCode() {
    if (this.countdown() > 0) return;

    this.otpError.set(null);
    this.resendingOtp.set(true);

    try {
      const dni = this.dniValue;
      const celular = this.celularValue;

      if (!celular) {
        this.otpError.set('No se encontró el celular');
        return;
      }

      const resp = await this.userService.solicitarCodigoSms(dni, celular);

      if (resp?.codigo && resp.codigo !== '0') {
        throw new Error(resp.mensaje || 'No se pudo reenviar el código');
      }

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

    const key = (event as any).inputType || (event as any).data;

    if (value && next) {
      next.focus();
    } else if (!value && prev && key === 'deleteContentBackward') {
      prev.focus();
    }
  }

  private get dniValue(): string {
    return this.dni().trim();
  }

  private get celularValue(): string {
    return String(this.datosForm.get('celular')?.value || '').trim(); // ajusta el nombre si es otro
  }

  async verifyAndCreate() {
    if (!this.otpValid) return;

    this.otpError.set(null);
    this.verifyingOtp.set(true);

    try {
      const dni = this.dniValue;
      const code = this.otpCode;

      const resp = await this.userService.validarCodigoSms(dni, code);

      if (resp?.codigo && resp.codigo !== '0') {
        throw new Error(resp.mensaje || 'Código incorrecto');
      }

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

    const password = String(this.credencialesForm.get('password')?.value || '').trim();

    const v = this.datosForm.getRawValue();

    const registroPayload = {
      dni: this.dni().trim(),
      nombres: v.nombres,
      apellidos: v.apellidos,
      empresa: v.empresaTrabajo,
      ingresoMensual: Number(v.ingresoMensual),
      ocupacion: v.ocupacion,
      estadoCivil: v.estadoCivil,
      gradoInstruccion: v.gradoInstruccion,
      diaCuota: Number(v.diaPago),
      celular: v.celular,
      correo: v.correo,
      comoConociste: v.comoConociste,
      departamento: v.departamentoDni,
      provincia: v.provinciaDni,
      distrito: v.distritoDni,
      domicilio: v.domicilioDni,
      password,
    };

    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      await this.userService.registrarUsuario(registroPayload);

      const loginPayload: LoginRequest = {
        usuario: registroPayload.dni,
        password,
      };

      await this.auth.login(loginPayload);

      localStorage.setItem('fortuna_show_welcome', '1');
      await this.router.navigate(['/home']);

    } catch (e: any) {
      this.errorMsg.set(e?.message ?? 'No se pudo completar el registro');
    } finally {
      this.isLoading.set(false);
    }
  }
}
