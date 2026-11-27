/** Busca, siguiendo la cadena de cause, el código de error de MySQL (p. ej. ER_DUP_ENTRY). */
export function codigoMysql(error: unknown): string | undefined {
  let actual: unknown = error;

  while (actual && typeof actual === 'object') {
    const { code } = actual as { code?: unknown };
    if (typeof code === 'string' && code.startsWith('ER_')) return code;

    actual = 'cause' in actual ? (actual as { cause?: unknown }).cause : undefined;
  }

  return undefined;
}

export const esDuplicado = (error: unknown): boolean => codigoMysql(error) === 'ER_DUP_ENTRY';
