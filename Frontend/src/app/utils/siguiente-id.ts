
// Las tablas con llave compuesta (p. ej. categorizer) no son autoincrementales:
// el cliente debe proponer el siguiente id dentro del proyecto.

export function siguienteId(elementos: readonly { id: number }[]): number {
  return elementos.reduce((max, e) => Math.max(max, e.id), 0) + 1;
}
