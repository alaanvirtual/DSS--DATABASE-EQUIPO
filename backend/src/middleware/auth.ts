import type { Request, RequestHandler } from 'express';
import { ApiError } from '../lib/ApiError';
import { type SesionUsuario, verificarToken } from '../lib/token';

/** Exige un token válido en `Authorization: Bearer <token>` y deja al usuario en req.sesion. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const [esquema, token] = req.header('authorization')?.split(' ') ?? [];

  if (esquema?.toLowerCase() !== 'bearer' || !token) {
    next(new ApiError(401, 'Se requiere iniciar sesión'));
    return;
  }

  try {
    req.sesion = verificarToken(token);
    next();
  } catch {
    next(new ApiError(401, 'La sesión no es válida o ya expiró'));
  }
};

/** Usuario autenticado de la petición (requireAuth debe haberse ejecutado antes). */
export function usuarioActual(req: Request): SesionUsuario {
  if (!req.sesion) throw new ApiError(401, 'Se requiere iniciar sesión');
  return req.sesion;
}
