import { z } from 'zod';

export const id = z.coerce.number().int().nonnegative();

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha esperado: YYYY-MM-DD');

export const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora esperado: HH:MM o HH:MM:SS');

export const decimal = z.coerce.number().finite();

export const estatus = z.coerce.number().int().min(1).max(2);
