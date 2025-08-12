//import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
//import { provideRouter } from '@angular/router';
//import { provideHttpClient } from '@angular/common/http';

//import { routes } from './app.routes';
//import { environment } from '../environments/environment';

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes)
  ]
};


