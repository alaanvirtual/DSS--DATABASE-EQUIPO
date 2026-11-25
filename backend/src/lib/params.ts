import { ApiError } from './ApiError';

export function integerParam(value: string | undefined, name: string): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new ApiError(400, `Parámetro inválido: ${name}`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new ApiError(400, `Parámetro fuera de rango: ${name}`);
  }

  return parsed;
}
