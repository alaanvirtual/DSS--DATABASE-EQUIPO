import { Router, type Request } from 'express';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import type { MySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import type { ZodTypeAny } from 'zod';
import { db } from '../db/client';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { esDuplicado } from '../lib/mysqlError';
import { validate } from '../middleware/validate';

export type KeyColumn = {
  param: string;
  column: MySqlColumn;
};

/** Id numérico que asigna el servidor (MAX + 1 dentro de `scope`) cuando el cliente no lo envía. */
export type ServerId = {
  column: MySqlColumn;
  /** Columnas que delimitan la numeración (p. ej. el proyecto). Sus valores salen de la ruta o del body. */
  scope: MySqlColumn[];
};

export type CrudConfig = {
  table: MySqlTable;
  label: string;
  createSchema: ZodTypeAny;
  updateSchema?: ZodTypeAny;
  inheritedKeys?: KeyColumn[];
  pathKeys?: KeyColumn[];
  /** Columnas filtrables en el listado mediante query string (p. ej. ?idtopico=3). */
  queryFilters?: KeyColumn[];
  /** Restringe qué filas puede listar el usuario de la petición (p. ej. solo sus proyectos). */
  scopeWhere?: (req: Request) => SQL | undefined;
  /** Transforma el body ya validado antes de guardarlo (p. ej. para hashear una contraseña). */
  transformBody?: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
  /** Reglas de dominio previas a un POST. Lanzan ApiError si no se cumplen. */
  beforeWrite?: (values: Record<string, unknown>, req: Request) => Promise<void>;
  /** Sustituye el INSERT simple (p. ej. para insertar varias filas en una transacción). Devuelve el id generado. */
  insertRow?: (values: Record<string, unknown>, req: Request) => Promise<number | undefined>;
  /** Columnas que nunca se devuelven en las respuestas (p. ej. `passw`). */
  hiddenColumns?: string[];
  orderBy?: (MySqlColumn | SQL | SQL.Aliased)[];
  autoIdColumn?: string;
  /** Id de llave compuesta que asigna el servidor si el cliente no lo envía. */
  serverId?: ServerId;
  router?: Router;
};

const INTENTOS_ID = 5;

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

  const hidden = new Set(config.hiddenColumns ?? []);

  // Quita de las respuestas las columnas ocultas.
  const visible = <T extends object>(row: T): T =>
    hidden.size === 0
      ? row
      : (Object.fromEntries(Object.entries(row).filter(([name]) => !hidden.has(name))) as T);

  const transform = async (body: Record<string, unknown>): Promise<Record<string, unknown>> =>
    config.transformBody ? config.transformBody(body) : body;

  const listWhere = (req: Request): SQL | undefined => {
    const conditions: SQL[] = [];

    const identity = identityWhere(req);
    if (identity) conditions.push(identity);

    const alcance = config.scopeWhere?.(req);
    if (alcance) conditions.push(alcance);

    for (const filter of config.queryFilters ?? []) {
      const raw = req.query[filter.param];
      if (raw === undefined) continue;

      if (typeof raw !== 'string') throw new ApiError(400, `Filtro inválido: ${filter.param}`);

      conditions.push(eq(filter.column, coerce(filter.column, raw, filter.param) as never));
    }

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

  const insertar = async (
    values: Record<string, unknown>,
    req: Request
  ): Promise<number | undefined> => {
    if (config.insertRow) return config.insertRow(values, req);

    const [result] = await db.insert(config.table).values(values as never);
    return result.insertId;
  };

  const siguienteId = async (serverId: ServerId, values: Record<string, unknown>): Promise<number> => {
    const conditions = serverId.scope.map((column) =>
      eq(column, values[String(column.name)] as never)
    );

    const [fila] = await db
      .select({ maximo: sql<string | number | null>`max(${serverId.column})` })
      .from(config.table)
      .where(and(...conditions));

    return Number(fila?.maximo ?? 0) + 1;
  };

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = db.select().from(config.table).where(listWhere(req));
      const rows =
        config.orderBy && config.orderBy.length > 0
          ? await query.orderBy(...config.orderBy)
          : await query;

      res.json(rows.map((row) => visible(row)));
    })
  );

  router.post(
    '/',
    validate(config.createSchema),
    asyncHandler(async (req, res) => {
      const body = await transform(req.body as Record<string, unknown>);
      const values: Record<string, unknown> = {
        ...body,
        ...identityValues(req)
      };

      await config.beforeWrite?.(values, req);

      const serverId = config.serverId;
      const idColumna = serverId ? String(serverId.column.name) : undefined;

      if (serverId && idColumna && values[idColumna] === undefined) {
        // Si dos peticiones eligen el mismo id a la vez, la segunda choca con la llave
        // primaria (ER_DUP_ENTRY): se recalcula y se reintenta.
        for (let intento = 1; ; intento++) {
          values[idColumna] = await siguienteId(serverId, values);

          try {
            await insertar(values, req);
            break;
          } catch (error) {
            if (!esDuplicado(error) || intento >= INTENTOS_ID) throw error;
          }
        }
      } else {
        const insertId = await insertar(values, req);

        if (config.autoIdColumn && values[config.autoIdColumn] === undefined) {
          values[config.autoIdColumn] = insertId;
        }
      }

      res.status(201).json(visible(values));
    })
  );

  if (pathKeys.length > 0) {
    router.get(
      itemPath,
      asyncHandler(async (req, res) => {
        res.json(visible(await findOne(req)));
      })
    );

    if (config.updateSchema) {
      router.patch(
        itemPath,
        validate(config.updateSchema),
        asyncHandler(async (req, res) => {
          const changes = await transform(req.body as Record<string, unknown>);

          if (Object.keys(changes).length === 0) {
            throw new ApiError(400, 'No se enviaron campos para actualizar');
          }

          await findOne(req);
          await db
            .update(config.table)
            .set(changes as never)
            .where(identityWhere(req));

          res.json(visible(await findOne(req)));
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
