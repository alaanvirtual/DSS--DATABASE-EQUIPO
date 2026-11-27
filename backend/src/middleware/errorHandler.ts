import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/ApiError';

type ErrorHttp = { status: number; message: string };

const mysqlErrors: Record<string, ErrorHttp> = {
  ER_DUP_ENTRY: { status: 409, message: 'El registro ya existe (clave duplicada)' },
  ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Referencia inválida: el registro relacionado no existe' },
  ER_ROW_IS_REFERENCED_2: { status: 409, message: 'No se puede eliminar: existen registros relacionados' },
  ER_DATA_TOO_LONG: { status: 400, message: 'Un valor excede la longitud permitida' },
  ER_TRUNCATED_WRONG_VALUE: { status: 400, message: 'Un valor tiene un formato inválido' },
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: { status: 400, message: 'Un valor tiene un formato inválido' },
  ER_BAD_NULL_ERROR: { status: 400, message: 'Falta un campo obligatorio' },
  ER_NO_DEFAULT_FOR_FIELD: { status: 400, message: 'Falta un campo obligatorio' },
  ER_WRONG_VALUE_COUNT_ON_ROW: { status: 400, message: 'Cantidad de valores inválida' },
  ER_WARN_DATA_OUT_OF_RANGE: { status: 400, message: 'Un valor numérico está fuera de rango' },
  ER_DATA_OUT_OF_RANGE: { status: 400, message: 'Un valor numérico está fuera de rango' },
  ER_CHECK_CONSTRAINT_VIOLATED: { status: 400, message: 'Un valor incumple una regla de la base de datos' },
  ER_LOCK_DEADLOCK: { status: 409, message: 'Conflicto de concurrencia, intenta de nuevo' },
  ER_LOCK_WAIT_TIMEOUT: { status: 503, message: 'La base de datos está ocupada, intenta de nuevo' },
  PROTOCOL_CONNECTION_LOST: { status: 503, message: 'La base de datos no está disponible' },
  ECONNREFUSED: { status: 503, message: 'La base de datos no está disponible' },
  ECONNRESET: { status: 503, message: 'La base de datos no está disponible' },
  ETIMEDOUT: { status: 503, message: 'La base de datos no respondió a tiempo' }
};

// TiDB reporta algunos conflictos con códigos propios que mysql2 no nombra.
const tidbErrnos: Record<number, ErrorHttp> = {
  9007: { status: 409, message: 'Conflicto de escritura, intenta de nuevo' },
  8022: { status: 409, message: 'Conflicto de escritura, intenta de nuevo' }
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
};

function mysqlCode(error: unknown): { code?: string; http: ErrorHttp } | undefined {
  let current: unknown = error;

  while (current && typeof current === 'object') {
    const { code, errno } = current as { code?: unknown; errno?: unknown };

    if (typeof code === 'string' && mysqlErrors[code]) {
      return { code, http: mysqlErrors[code]! };
    }

    if (typeof errno === 'number' && tidbErrnos[errno]) {
      return { code: `TIDB_${errno}`, http: tidbErrnos[errno]! };
    }

    current = 'cause' in current ? (current as { cause?: unknown }).cause : undefined;
  }

  return undefined;
}

// Errores de body-parser (JSON mal formado, cuerpo demasiado grande, etc.).
function cuerpoInvalido(error: unknown): ErrorHttp | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const { type } = error as { type?: unknown };

  if (type === 'entity.parse.failed') {
    return { status: 400, message: 'El cuerpo de la petición no es un JSON válido' };
  }

  if (type === 'entity.too.large') {
    return { status: 413, message: 'El cuerpo de la petición es demasiado grande' };
  }

  if (type === 'encoding.unsupported' || type === 'charset.unsupported') {
    return { status: 415, message: 'Codificación del cuerpo no soportada' };
  }

  return undefined;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: error.message,
      ...(error.details === undefined ? {} : { details: error.details })
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Datos inválidos', details: error.flatten() });
    return;
  }

  const cuerpo = cuerpoInvalido(error);

  if (cuerpo) {
    res.status(cuerpo.status).json({ error: cuerpo.message });
    return;
  }

  const mysql = mysqlCode(error);

  if (mysql) {
    if (mysql.http.status >= 500) console.error('Error de base de datos:', error);
    res.status(mysql.http.status).json({ error: mysql.http.message, code: mysql.code });
    return;
  }

  console.error('Error no controlado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
};
