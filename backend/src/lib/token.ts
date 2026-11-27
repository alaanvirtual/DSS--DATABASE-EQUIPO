import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** Datos del usuario que viajan firmados dentro del token de sesión. */
export interface SesionUsuario {
  id: number;
  usuario: string;
}

export function firmarToken(sesion: SesionUsuario): string {
  return jwt.sign({ usuario: sesion.usuario }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(sesion.id),
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

/** Verifica firma y vigencia. Lanza un error si el token no es válido. */
export function verificarToken(token: string): SesionUsuario {
  const carga = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

  if (typeof carga === 'string' || !carga.sub || typeof carga.usuario !== 'string') {
    throw new Error('Token con formato inválido');
  }

  const id = Number(carga.sub);
  if (!Number.isSafeInteger(id)) throw new Error('Token con formato inválido');

  return { id, usuario: carga.usuario };
}
