import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { errorApiInterceptor } from './auth/interceptors/error-api.interceptor';
import { tokenInterceptor } from './auth/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // El orden importa: tokenInterceptor envuelve a errorApiInterceptor, así que ve el error ya traducido.
    provideHttpClient(withInterceptors([tokenInterceptor, errorApiInterceptor]))
  ]
};
