import { RenderMode, ServerRoute } from '@angular/ssr';

// The admin dashboard is behind a login and keeps the session in the browser,
// so every page is rendered on the client (no prerender / SSR of private pages).
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
