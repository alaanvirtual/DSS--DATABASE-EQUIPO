import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';


// Traduce los errores HTTP de la API ({ error: "mensaje" }) a un Error
// con un mensaje legible en español para mostrarlo al usuario.
export const errorApiInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      let mensaje = 'Ocurrió un error inesperado';

      if (err instanceof HttpErrorResponse) {
        if (err.status === 0) {
          mensaje = 'No se pudo conectar con el servidor';
        } else {
          const cuerpo = err.error as { error?: string } | null;
          mensaje = cuerpo?.error ?? `Error ${err.status}`;
        }
      }

      return throwError(() => new Error(mensaje));
    })
  );