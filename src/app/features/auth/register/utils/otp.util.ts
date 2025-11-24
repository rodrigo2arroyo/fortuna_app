import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export function getOtpCode(value: any): string {
  const { d1, d2, d3, d4, d5, d6 } = value ?? {};
  return `${d1 ?? ''}${d2 ?? ''}${d3 ?? ''}${d4 ?? ''}${d5 ?? ''}${d6 ?? ''}`;
}

export function buildOtpForm(fb: FormBuilder): FormGroup {
  const digitCtrl = ['', [Validators.required, Validators.pattern(/^\d$/)]];
  return fb.group({
    d1: [...digitCtrl],
    d2: [...digitCtrl],
    d3: [...digitCtrl],
    d4: [...digitCtrl],
    d5: [...digitCtrl],
    d6: [...digitCtrl],
  });
}
