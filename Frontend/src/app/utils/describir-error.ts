import { ErrorApi } from '../models/error-api';

/** Texto e ícono con los que una pantalla de error presenta un fallo. */
export interface DescripcionError {
  icono: string;
  titulo: string;
  descripcion: string;
  /** Si volver a intentar tiene sentido (no lo tiene si falta un permiso o no existe el recurso). */
  reintentable: boolean;
}

/** Convierte cualquier error en lo que se le muestra al usuario en <app-estado-error>. */
export function describirError(error: unknown): DescripcionError {
  const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
  const estado = error instanceof ErrorApi ? error.estado : -1;

  if (estado === 0) {
    return {
      icono: 'wifi-slash',
      titulo: 'Sin conexión con el servidor',
      descripcion: 'Revisa tu conexión o que el servidor esté en marcha e inténtalo de nuevo.',
      reintentable: true
    };
  }

  if (estado === 401) {
    return {
      icono: 'lock-key',
      titulo: 'Tu sesión no es válida',
      descripcion: 'Inicia sesión de nuevo para continuar.',
      reintentable: false
    };
  }

  if (estado === 403) {
    return {
      icono: 'prohibit',
      titulo: 'No tienes permiso',
      descripcion: mensaje,
      reintentable: false
    };
  }

  if (estado === 404) {
    return {
      icono: 'magnifying-glass',
      titulo: 'No se encontró lo que buscas',
      descripcion: mensaje,
      reintentable: false
    };
  }

  if (estado >= 500) {
    return {
      icono: 'warning-octagon',
      titulo: 'El servidor tuvo un problema',
      descripcion: 'Ocurrió un error en el servidor. Inténtalo de nuevo en unos momentos.',
      reintentable: true
    };
  }

  return { icono: 'warning-circle', titulo: 'Algo salió mal', descripcion: mensaje, reintentable: true };
}
