import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { ApiError } from '../../../../core/models';
import { Toast } from '../../../../core/services/toast';

// Staff password policy of the API: 10+ characters, upper case, lower case and a digit.
export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;

export function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const a = group.get('new_password')?.value;
  const b = group.get('confirm_password')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

// Used for the forced first change (/auth/change-password) and inside the profile page (embedded = true).
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-change-password',
  templateUrl: './change-password.html',
})
export class ChangePassword {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  readonly embedded = input(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly forced = this.auth.mustChangePassword;

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      current_password: ['', [Validators.required, Validators.maxLength(128)]],
      new_password: ['', [Validators.required, Validators.pattern(STRONG_PASSWORD)]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.changePassword(this.form.getRawValue()).subscribe({
      next: async () => {
        this.loading.set(false);
        this.toast.success('Password changed. Please sign in with the new password.');
        // The API signs the user out (security stamp changed).
        await this.auth.logout(false);
        void this.router.navigate(['/auth/login']);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }

  cancel(): void {
    void this.auth.logout();
  }
}
