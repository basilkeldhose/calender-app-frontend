import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Merge provideAnimations into any existing providers in appConfig
const mergedAppConfig = {
  ...appConfig,
  providers: [...(appConfig?.providers ?? []), provideAnimations()]
};

bootstrapApplication(AppComponent, mergedAppConfig)
  .catch((err) => console.error(err));
