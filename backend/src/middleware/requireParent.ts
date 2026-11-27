import type { RequestHandler } from 'express';
import { and, eq } from 'drizzle-orm';
import type { MySqlTable } from 'drizzle-orm/mysql-core';
import type { KeyColumn } from '../crud/createCrudRouter';
import { db } from '../db/client';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { integerParam } from '../lib/params';

// Verifica que el recurso padre de una ruta anidada exista (p. ej. el proyecto en
// /proyectos/:idproy/alternativas). Si no existe responde 404 en lugar de una lista vacía.
export function requireParent(table: MySqlTable, label: string, keys: KeyColumn[]): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const conditions = keys.map((key) =>
      eq(key.column, integerParam(req.params[key.param], key.param) as never)
    );

    const rows = await db
      .select()
      .from(table)
      .where(and(...conditions))
      .limit(1);

    if (!rows[0]) throw new ApiError(404, `${label} no encontrado`);

    next();
  });
}
