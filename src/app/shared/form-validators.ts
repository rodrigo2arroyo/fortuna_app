import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordsMatchValidator(
  passwordKey = 'password',
  confirmKey = 'passwordConfirm'
): ValidatorFn {
  return (group: AbstractControl) => {
    const pass = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    if (!pass || !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  };
}
