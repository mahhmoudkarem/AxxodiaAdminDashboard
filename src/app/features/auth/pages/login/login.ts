import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/auth/services/auth';
import { ApiError } from '../../../../core/models';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  // ?returnUrl=/reservations (bound by withComponentInputBinding)
  readonly returnUrl = input<string | undefined>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email.trim(), password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.must_change_password) {
          void this.router.navigate(['/auth/change-password']);
          return;
        }
        const target = this.returnUrl();
        void this.router.navigateByUrl(target && target.startsWith('/') && !target.startsWith('/auth') ? target : '/dashboard');
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.error.set(this.message(err));
      },
    });
  }

  private message(err: ApiError): string {
    switch (err.code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return 'Wrong email or password.';
      case 'AUTH_ACCOUNT_LOCKED': {
        const min = err.retryAfterSeconds ? Math.ceil(err.retryAfterSeconds / 60) : 15;
        return `Too many failed attempts. The account is locked for about ${min} minute(s).`;
      }
      case 'AUDIENCE_WRONG':
        return 'This account cannot use the admin dashboard. Please use the Axxodia mobile app.';
      case 'AUTH_ACCOUNT_DISABLED':
        return 'This account is disabled. Please contact the administrator.';
      case 'AUTH_NO_PERMISSIONS':
        return 'This account has no permissions yet.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please wait a little and try again.';
      default:
        return err.message || 'Sign in failed. Please try again.';
    }
  }
}
