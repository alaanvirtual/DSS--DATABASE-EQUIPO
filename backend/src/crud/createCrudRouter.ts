import { Router, type Request } from 'express';
import { and, eq, type SQL } from 'drizzle-orm';
import type { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import type { ZodTypeAny } from 'zod';
import { db } from '../db/client';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { validate } from '../middleware/validate';

export type KeyColumn = {
  param: string;
  column: MySqlColumn;
};

export type CrudConfig = {
  table: MySqlTable;
  label: string;
  createSchema: ZodTypeAny;
  updateSchema?: ZodTypeAny;
  inheritedKeys?: KeyColumn[];
  pathKeys?: KeyColumn[];
  orderBy?: (MySqlColumn | SQL | SQL.Aliased)[];
  autoIdColumn?: string;
  router?: Router;
};

function coerce(column: MySqlColumn, raw: string, name: string): string | number {
  if (column.dataType === 'number') {
    if (!/^-?\d+$/.test(raw)) throw new ApiError(400, `Parámetro inválido: ${name}`);

    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed)) throw new ApiError(400, `Parámetro fuera de rango: ${name}`);

    return parsed;
  }

  return raw;
}

export function createCrudRouter(config: CrudConfig): Router {
  const router = config.router ?? Router({ mergeParams: true });
  const keys = [...(config.inheritedKeys ?? []), ...(config.pathKeys ?? [])];
  const pathKeys = config.pathKeys ?? [];
  const itemPath = pathKeys.map((key) => `/:${key.param}`).join('');

  const identityValues = (req: Request): Record<string, string | number> => {
    const values: Record<string, string | number> = {};

    for (const key of keys) {
      const raw = req.params[key.param];
      if (raw === undefined) continue;

      values[String(key.column.name)] = coerce(key.column, raw, key.param);
    }

    return values;
  };

  const identityWhere = (req: Request): SQL | undefined => {
    const values = identityValues(req);
    const conditions = keys
      .filter((key) => values[String(key.column.name)] !== undefined)
      .map((key) => eq(key.column, values[String(key.column.name)] as never));

    if (conditions.length === 0) return undefined;
    return conditions.length === 1 ? conditions[0]! : and(...conditions)!;
  };

  const findOne = async (req: Request) => {
    const rows = await db
      .select()
      .from(config.table)
      .where(identityWhere(req))
      .limit(1);

    const row = rows[0];

    if (!row) throw new ApiError(404, `${config.label} no encontrado`);

    return row;
  };

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = db.select().from(config.table).where(identityWhere(req));
      const rows =
        config.orderBy && config.orderBy.length > 0
          ? await query.orderBy(...config.orderBy)
          : await query;

      res.json(rows);
    })
  );

  router.post(
    '/',
    validate(config.createSchema),
    asyncHandler(async (req, res) => {
      const values: Record<string, unknown> = {
        ...(req.body as Record<string, unknown>),
        ...identityValues(req)
      };

      const [result] = await db.insert(config.table).values(values as never);

      if (config.autoIdColumn && values[config.autoIdColumn] === undefined) {
        values[config.autoIdColumn] = result.insertId;
      }

      res.status(201).json(values);
    })
  );

  if (pathKeys.length > 0) {
    router.get(
      itemPath,
      asyncHandler(async (req, res) => {
        res.json(await findOne(req));
      })
    );

    if (config.updateSchema) {
      router.patch(
        itemPath,
        validate(config.updateSchema),
        asyncHandler(async (req, res) => {
          const changes = req.body as Record<string, unknown>;

          if (Object.keys(changes).length === 0) {
            throw new ApiError(400, 'No se enviaron campos para actualizar');
          }

          await findOne(req);
          await db
            .update(config.table)
            .set(changes as never)
            .where(identityWhere(req));

          res.json(await findOne(req));
        })
      );
    }

    router.delete(
      itemPath,
      asyncHandler(async (req, res) => {
        await findOne(req);
        await db.delete(config.table).where(identityWhere(req));

        res.status(204).send();
      })
    );
  }

  return router;
}
