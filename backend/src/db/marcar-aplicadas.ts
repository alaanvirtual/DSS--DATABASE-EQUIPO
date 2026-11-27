// Marca como YA APLICADAS las migraciones de ./drizzle, sin ejecutarlas.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { env } from '../config/env';
import { rawRows } from '../lib/rawRows';
import { db, pool } from './client';

type EntradaDiario = { tag: string; when: number };

const carpeta = path.resolve(__dirname, '../../drizzle');

async function main() {
  console.log(`Destino: ${env.DB_HOST}:${env.DB_PORT} / base "${env.DB_NAME}"`);

  const rutaDiario = path.join(carpeta, 'meta', '_journal.json');

  if (!fs.existsSync(rutaDiario)) {
    console.error('No hay migraciones en ./drizzle. Ejecuta antes: npm run db:generate');
    process.exitCode = 1;
    return;
  }

  const diario = JSON.parse(fs.readFileSync(rutaDiario, 'utf8')) as { entries: EntradaDiario[] };

  if (diario.entries.length === 0) {
    console.error('El diario de migraciones está vacío.');
    process.exitCode = 1;
    return;
  }

  if (!process.argv.includes('--yes')) {
    console.error('Se marcarán como aplicadas, sin ejecutarlas, estas migraciones:');
    for (const entrada of diario.entries) console.error(`  - ${entrada.tag}`);
    console.error(
      'Úsalo solo si la BD ya tiene ese esquema. Para continuar: npm run db:marcar-aplicadas -- --yes'
    );
    process.exitCode = 1;
    return;
  }

  await db.execute(
    sql`create table if not exists __drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`
  );

  const [{ total } = { total: 0 }] = await rawRows<{ total: number | string }>(
    sql`select count(*) as total from __drizzle_migrations`
  );

  if (Number(total) > 0) {
    console.error('__drizzle_migrations ya tiene migraciones registradas: no se hace nada.');
    process.exitCode = 1;
    return;
  }

  for (const entrada of diario.entries) {
    const contenido = fs.readFileSync(path.join(carpeta, `${entrada.tag}.sql`)).toString();
    const hash = createHash('sha256').update(contenido).digest('hex');

    await db.execute(
      sql`insert into __drizzle_migrations (hash, created_at) values (${hash}, ${entrada.when})`
    );
    console.log(`Marcada como aplicada: ${entrada.tag}`);
  }
}

main()
  .catch((error) => {
    console.error('No se pudieron marcar las migraciones como aplicadas:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
