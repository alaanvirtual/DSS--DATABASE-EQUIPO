import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { env } from '../config/env';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { rawRows } from '../lib/rawRows';

type CountRow = { total: number | string };

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      const rows = await rawRows<CountRow>(
        sql`SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ${env.DB_NAME}`
      );

      res.json({
        status: 'ok',
        database: env.DB_NAME,
        tables_count: Number(rows[0]?.total ?? 0)
      });
    } catch (error) {
      // El detalle del fallo solo se registra en el servidor: no se expone al cliente.
      console.error('Health check falló:', error);
      throw new ApiError(503, 'No se pudo conectar a la base de datos');
    }
  })
);
