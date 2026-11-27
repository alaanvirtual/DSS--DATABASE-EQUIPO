import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Protege las rutas: sin sesión activa redirige a /login, recordando la página que se
 * pedía para volver a ella al iniciar sesión.
 */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.autenticado()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};
