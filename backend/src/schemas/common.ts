import { z } from 'zod';

// Acepta números y cadenas numéricas ("3"), pero rechaza "", booleanos y null.
// (z.coerce.number() convertía "" en 0 y true en 1 sin avisar.)
const numero = (esquema: z.ZodNumber) =>
  z.preprocess(
    (valor) => (typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor),
    esquema
  );

// Límite de las columnas DECIMAL(10, 4): 6 enteros y 4 decimales.
const LIMITE_DECIMAL = 999999.9999;

export const id = numero(z.number().int().positive());

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha esperado: YYYY-MM-DD');

export const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora esperado: HH:MM o HH:MM:SS');

export const pesoDecimal = numero(z.number().finite().min(0).max(LIMITE_DECIMAL));

export const valorDecimal = numero(
  z.number().finite().min(-LIMITE_DECIMAL).max(LIMITE_DECIMAL)
);

export const votoPorcentaje = numero(z.number().finite().min(0).max(100));

export const estatus = numero(z.number().int().min(1).max(2));

// Rol(es) con los que participa un tópico de la agenda: "FAC", "DEC" o "FAC, DEC".
export const rolAgenda = z
  .string()
  .regex(/^(FAC|DEC|FAC, ?DEC|DEC, ?FAC)$/, 'Rol esperado: FAC, DEC o "FAC, DEC"');
