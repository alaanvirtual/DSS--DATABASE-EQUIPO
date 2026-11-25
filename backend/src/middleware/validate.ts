import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../lib/ApiError';

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new ApiError(400, 'Datos inválidos', result.error.flatten()));
      return;
    }

    req.body = result.data;
    next();
  };
}
