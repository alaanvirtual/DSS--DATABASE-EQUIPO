// Convierte a hash (scrypt) las contraseñas que aún estén en texto plano.
import { eq } from 'drizzle-orm';
import { env } from '../config/env';
import { esHash, hashPassword } from '../lib/password';
import { db, pool } from './client';
import { usuarios } from './schema';

async function main() {
  console.log(`Destino: ${env.DB_HOST}:${env.DB_PORT} / base "${env.DB_NAME}"`);

  const todos = await db.select({ id: usuarios.id, passw: usuarios.passw }).from(usuarios);
  const pendientes = todos.filter((usuario) => !esHash(usuario.passw));

  for (const usuario of pendientes) {
    const hash = await hashPassword(usuario.passw);
    await db.update(usuarios).set({ passw: hash }).where(eq(usuarios.id, usuario.id));
  }

  console.log(
    `Usuarios: ${todos.length}. Contraseñas convertidas a hash: ${pendientes.length}. Ya eran hash: ${
      todos.length - pendientes.length
    }.`
  );
}

main()
  .catch((error) => {
    console.error('No se pudieron convertir las contraseñas:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
