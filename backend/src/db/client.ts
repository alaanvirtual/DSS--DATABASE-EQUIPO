import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { env } from '../config/env';
import * as schema from './schema';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10_000,
  // TiDB Cloud corta las conexiones inactivas: se mantienen vivas y las ociosas se liberan antes.
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  idleTimeout: 60_000,
  dateStrings: true,
  ssl: env.ssl ? { minVersion: 'TLSv1.2' } : undefined
});

export const db = drizzle(pool, { schema, mode: 'default' });
