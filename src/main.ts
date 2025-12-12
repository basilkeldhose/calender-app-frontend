import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ToastrModule } from 'ngx-toastr';

// Merge Toastr + Animations into appConfig providers
const mergedAppConfig = {
  ...appConfig,
  providers: [
    ...(appConfig?.providers ?? []),

    // Required for ngx-toastr animations
    provideAnimations(),

    // Register Toastr global providers
    importProvidersFrom(
      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'toast-bottom-right',
        preventDuplicates: true,
        closeButton: true
      })
    )
  ]
};

bootstrapApplication(AppComponent, mergedAppConfig)
  .catch((err) => console.error(err));
