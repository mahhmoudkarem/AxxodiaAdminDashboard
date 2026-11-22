import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';

@Component({
  imports: [RouterOutlet, BrandLogo, ToastContainer],
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.html',
  host: { class: 'block min-h-screen' },
})
export class AuthLayout {
  readonly year = new Date().getFullYear();
}
