import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err);

  // A failed startup (e.g. the runtime config could not be loaded) must be visible on the page.
  const root = document.querySelector('app-root');
  if (root) {
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.className = 'startup-error';
    const detail = err instanceof Error ? err.message : String(err);
    message.textContent = `No se ha podido iniciar Kora Health. ${detail}`;
    root.replaceChildren(message);
  }
});
