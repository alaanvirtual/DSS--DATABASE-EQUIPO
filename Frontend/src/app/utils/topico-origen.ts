import { HERRAMIENTA, TopicoAgenda } from '../models/agenda';

// Un tópico de categorización organiza las ideas de la lluvia de ideas que lo
// precede en la agenda: el tópico de herramienta 2 más cercano con id menor.

export function topicoOrigen(
  agenda: readonly TopicoAgenda[],
  actual: TopicoAgenda | undefined
): TopicoAgenda | undefined {
  if (!actual) return undefined;

  return agenda
    .filter((t) => t.idtool === HERRAMIENTA.LLUVIA_IDEAS && t.id < actual.id)
    .sort((a, b) => b.id - a.id)[0];
}

/** Indica si un rol ("FAC", "DEC" o "FAC, DEC") de la agenda incluye al rol dado. */
export function rolIncluye(rolesAgenda: string, rol: string): boolean {
  return rolesAgenda.split(',').some((r) => r.trim() === rol);
}
