import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/ApiError';

const mysqlErrors: Record<string, { status: number; message: string }> = {
  ER_DUP_ENTRY: { status: 409, message: 'El registro ya existe (clave duplicada)' },
  ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Referencia inválida: el registro relacionado no existe' },
  ER_ROW_IS_REFERENCED_2: { status: 409, message: 'No se puede eliminar: existen registros relacionados' },
  ER_DATA_TOO_LONG: { status: 400, message: 'Un valor excede la longitud permitida' },
  ER_TRUNCATED_WRONG_VALUE: { status: 400, message: 'Un valor tiene un formato inválido' },
  ER_BAD_NULL_ERROR: { status: 400, message: 'Falta un campo obligatorio' },
  ER_WRONG_VALUE_COUNT_ON_ROW: { status: 400, message: 'Cantidad de valores inválida' }
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
};

function mysqlCode(error: unknown): string | undefined {
  let current: unknown = error;

  while (current && typeof current === 'object') {
    if ('code' in current) {
      const code = (current as { code?: unknown }).code;
      if (typeof code === 'string' && mysqlErrors[code]) return code;
    }

    current = 'cause' in current ? (current as { cause?: unknown }).cause : undefined;
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

  const code = mysqlCode(error);

  if (code) {
    const { status, message } = mysqlErrors[code]!;
    res.status(status).json({ error: message, code });
    return;
  }

  console.error('Error no controlado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
};
