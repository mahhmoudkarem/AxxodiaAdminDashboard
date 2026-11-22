import { bootstrapApplication } from '@angular/platform-browser';
import { config } from 'rxjs';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// A failed API call that a page did not handle itself is already shown as an alert by errorInterceptor.
// Without this, rxjs would also re-throw it and the browser would print it in the console.
config.onUnhandledError = (err: unknown) => {
  const isApiError = !!err && typeof err === 'object' && 'status' in err && 'code' in err;
  if (!isApiError) queueMicrotask(() => { throw err; }); // real bugs still reach the GlobalErrorHandler (alert)
};

bootstrapApplication(App, appConfig).catch(() => {
  // The app could not start at all: show a readable message instead of a console error.
  const box = document.querySelector('app-root');
  if (box) {
    box.innerHTML =
      '<div style="font-family:Lato,sans-serif;text-align:center;padding:80px 20px;color:#594638">' +
      '<img src="images/brand/axxodia-logo.png" alt="Axxodia" style="height:90px"><h2>The dashboard could not start.</h2>' +
      '<p>Please reload the page.</p></div>';
  }
});
