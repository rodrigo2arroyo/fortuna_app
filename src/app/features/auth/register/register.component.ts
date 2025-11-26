import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { formatCountdown } from './utils/time-format.utils';
import { buildOtpForm, getOtpCode } from './utils/otp.util';
import { CELULAR_REGEX, DNI_REGEX } from './utils/validators.const';
import { passwordsMatchValidator } from '../../../shared/form-validators';
import {AuthService} from '../services/auth.service';
import {LoginRequest} from '../models/auth.model';

type Step = 'identidad' | 'datos' | 'verificacion' | 'credenciales';
const steps: Step[] = ['identidad', 'datos', 'verificacion', 'credenciales'];

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth   = inject(AuthService);

  step = signal<Step>('identidad');
  dni = signal<string>('');
  accepted = signal<boolean>(false);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  showPassword = signal(false);
  showPasswordConfirm = signal(false);

  countdown = signal(190);
  private countdownId: any;

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

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownId) clearInterval(this.countdownId);
  }

  next() {
    const current = this.step();

    if (current === 'identidad') {
      if (!this.dniValid() || !this.accepted()) return;
    }

    if (current === 'datos') {
      if (this.datosForm.invalid) {
        this.datosForm.markAllAsTouched();
        return;
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

  resendCode() {
    if (this.countdown() > 0) return;
    this.startCountdown();
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

  verifyAndCreate() {
    if (!this.otpValid) return;
    const code = this.otpCode;
    this.next();
  }

  async finish() {
    this.credencialesForm.markAllAsTouched();

    // if (!this.credencialesValid()) return;

    const password = this.credencialesForm.get('password')?.value;

    const registroPayload = {
      dni: this.dni().trim(),
      ...this.datosForm.value,
      password,
    };

    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      // TODO:
      // await this.auth.register(registroPayload);

      const loginPayload: LoginRequest = {
        usuario: '11111111', // temporal
        password: '12345678', // temporal
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
