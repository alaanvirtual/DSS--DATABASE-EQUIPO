import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { usuarios } from '../db/schema';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { fingirVerificacion, verifyPassword } from '../lib/password';
import { firmarToken } from '../lib/token';
import { requireAuth, usuarioActual } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/entities';

export const authRouter = Router();

// La contraseña (hash) nunca sale de la API.
const datosPublicos = (u: typeof usuarios.$inferSelect) => ({
  id: u.id,
  nombre: u.nombre,
  telefono: u.telefono,
  correo: u.correo,
  usuario: u.usuario
});

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { usuario, passw } = req.body as { usuario: string; passw: string };

    const [encontrado] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.usuario, usuario))
      .limit(1);

    // Mismo mensaje y mismo costo de cálculo exista o no el usuario.
    if (!encontrado) {
      await fingirVerificacion(passw);
      throw new ApiError(401, 'Usuario o contraseña incorrectos');
    }

    if (!(await verifyPassword(passw, encontrado.passw))) {
      throw new ApiError(401, 'Usuario o contraseña incorrectos');
    }

    res.json({
      token: firmarToken({ id: encontrado.id, usuario: encontrado.usuario }),
      usuario: datosPublicos(encontrado)
    });
  })
);

// Usuario de la sesión actual; sirve para comprobar que el token sigue siendo válido.
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [encontrado] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, usuarioActual(req).id))
      .limit(1);

    if (!encontrado) throw new ApiError(401, 'La sesión no es válida');

    res.json(datosPublicos(encontrado));
  })
);

// Renueva la sesión: con un token aún vigente entrega uno nuevo, para que el usuario no
// pierda su trabajo cuando la sesión está por vencer. Un token ya vencido no se renueva.
authRouter.post(
  '/refresh',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [encontrado] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, usuarioActual(req).id))
      .limit(1);

    if (!encontrado) throw new ApiError(401, 'La sesión no es válida');

    res.json({
      token: firmarToken({ id: encontrado.id, usuario: encontrado.usuario }),
      usuario: datosPublicos(encontrado)
    });
  })
);
