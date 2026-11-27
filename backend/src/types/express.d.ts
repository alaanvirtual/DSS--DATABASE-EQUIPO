import type { Rol } from '../lib/roles';
import type { SesionUsuario } from '../lib/token';

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado (lo asigna requireAuth a partir del token). */
      sesion?: SesionUsuario;
      /** Rol del usuario en el proyecto de la ruta (lo asigna requireParticipante). */
      rolProyecto?: Rol;
    }
  }
}

export {};
