import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <img src="images/brand/axxodia-logo.png" alt="Axxodia" class="mb-6 h-28 w-auto" />
      <p class="font-heading text-7xl font-bold text-brand-taupe">404</p>
      <h1 class="mt-2 font-heading text-3xl font-bold text-brand-brown">Page not found</h1>
      <p class="mt-2 max-w-md text-sm text-stone-400">The page you are looking for does not exist or was moved.</p>
      <a routerLink="/dashboard" class="btn btn-primary mt-6"><i class="fa-solid fa-house"></i> Back to dashboard</a>
    </div>
  `,
})
export class NotFound {}
