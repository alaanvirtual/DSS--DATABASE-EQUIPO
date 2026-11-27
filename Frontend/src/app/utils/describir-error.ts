import { ErrorApi } from '../models/error-api';

/** Texto e ícono con los que una pantalla de error presenta un fallo. */
export interface DescripcionError {
  icono: string;
  titulo: string;
  descripcion: string;
}

/** Convierte cualquier error en lo que se le muestra al usuario en <app-estado-error>. */
export function describirError(error: unknown): DescripcionError {
  const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
  const estado = error instanceof ErrorApi ? error.estado : -1;

  if (estado === 0) {
    return {
      icono: 'wifi-slash',
      titulo: 'Sin conexión con el servidor',
      descripcion: 'Revisa tu conexión o que el servidor esté en marcha e inténtalo de nuevo.'
    };
  }

  if (estado === 401 || estado === 403) {
    return {
      icono: 'lock-key',
      titulo: 'No tienes acceso',
      descripcion: mensaje
    };
  }

  if (estado === 404) {
    return {
      icono: 'magnifying-glass',
      titulo: 'No se encontró lo que buscas',
      descripcion: mensaje
    };
  }

  if (estado >= 500) {
    return {
      icono: 'warning-octagon',
      titulo: 'El servidor tuvo un problema',
      descripcion: 'Ocurrió un error en el servidor. Inténtalo de nuevo en unos momentos.'
    };
  }

  return { icono: 'warning-circle', titulo: 'Algo salió mal', descripcion: mensaje };
}
