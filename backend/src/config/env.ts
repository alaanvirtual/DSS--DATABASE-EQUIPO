import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const backendRoot = path.resolve(__dirname, '../..');

for (const fileName of ['.env', 'env']) {
  const filePath = path.join(backendRoot, fileName);
  if (fs.existsSync(filePath)) dotenv.config({ path: filePath });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1, 'DB_HOST es requerido'),
  DB_PORT: z.coerce.number().int().positive().default(4000),
  DB_USER: z.string().min(1, 'DB_USER es requerido'),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1).default('dss_sadmg'),
  DB_SSL: z.enum(['true', 'false']).default('true')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  ssl: parsed.data.DB_SSL === 'true'
};
