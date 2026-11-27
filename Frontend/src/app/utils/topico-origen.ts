import { HERRAMIENTA, TopicoAgenda } from '../models/agenda';

// Busca el tópico más cercano de una herramienta específica que precede al actual
// en la agenda (id menor más alto).

export function topicoPrevio(
  agenda: readonly TopicoAgenda[],
  actual: TopicoAgenda | undefined,
  idtool: number
): TopicoAgenda | undefined {
  if (!actual) return undefined;

  return agenda
    .filter((t) => t.idtool === idtool && t.id < actual.id)
    .sort((a, b) => b.id - a.id)[0];
}

// Un tópico de categorización (o comentador) trabaja sobre las ideas de la lluvia
// de ideas que lo precede en la agenda: el tópico de herramienta 2 más cercano con id menor.

export function topicoOrigen(
  agenda: readonly TopicoAgenda[],
  actual: TopicoAgenda | undefined
): TopicoAgenda | undefined {
  return topicoPrevio(agenda, actual, HERRAMIENTA.LLUVIA_IDEAS);
}

/** Indica si un rol ("FAC", "DEC" o "FAC, DEC") de la agenda incluye al rol dado. */
export function rolIncluye(rolesAgenda: string, rol: string): boolean {
  return rolesAgenda.split(',').some((r) => r.trim() === rol);
}
