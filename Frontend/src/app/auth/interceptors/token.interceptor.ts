import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorApi } from '../../models/error-api';
import { AuthService } from '../../services/auth.service';
import { environment } from '../environment/environment';

// Con apiUrl vacío (producción, mismo origen) la API son las URLs relativas.
const esPeticionApi = (url: string): boolean =>
  environment.apiUrl === '' ? !/^https?:\/\//.test(url) : url.startsWith(environment.apiUrl);

/**
 * Envía el token de sesión en cada petición a la API (Authorization: Bearer). Si el
 * servidor responde 401 (token vencido o inválido) cierra la sesión y manda al login.
 * Debe ir ANTES de errorApiInterceptor para recibir el ErrorApi ya traducido.
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  const peticion =
    token && esPeticionApi(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      const esLogin = req.url.endsWith('/auth/login');

      if (error instanceof ErrorApi && error.estado === 401 && !esLogin) {
        auth.salir();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
