import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { usuarios } from '../db/schema';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/entities';

export const authRouter = Router();

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

    if (!encontrado || encontrado.passw !== passw) {
      throw new ApiError(401, 'Usuario o contraseña incorrectos');
    }

    res.json({
      id: encontrado.id,
      nombre: encontrado.nombre,
      telefono: encontrado.telefono,
      correo: encontrado.correo,
      usuario: encontrado.usuario
    });
  })
);
