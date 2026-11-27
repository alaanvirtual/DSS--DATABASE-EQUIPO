import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env';

// Configuración de Drizzle Kit (migraciones). src/db/schema.ts es la fuente de verdad:
//   npm run db:generate   crea una migración SQL en ./drizzle a partir de los cambios del schema
//   npm run db:migrate    aplica a la BD las migraciones pendientes
// Usa las mismas variables de entorno (.env) que la API.
export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.ssl ? { minVersion: 'TLSv1.2' } : undefined
  },
  strict: true,
  verbose: true
});
