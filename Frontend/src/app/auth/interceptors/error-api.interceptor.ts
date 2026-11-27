import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorApi } from '../../models/error-api';

// Traduce los errores HTTP de la API ({ error: "mensaje" }) a un ErrorApi
// con un mensaje legible en español y el código HTTP para decidir qué mostrar.
export const errorApiInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      let mensaje = 'Ocurrió un error inesperado';
      let estado = -1;

      if (err instanceof HttpErrorResponse) {
        estado = err.status;

        if (err.status === 0) {
          mensaje = 'No se pudo conectar con el servidor';
        } else {
          const cuerpo = err.error as { error?: string } | null;
          mensaje = cuerpo?.error ?? `Error ${err.status}`;
        }
      }

      return throwError(() => new ErrorApi(mensaje, estado));
    })
  );
