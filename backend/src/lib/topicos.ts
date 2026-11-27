import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { agenda } from '../db/schema';

/** Ids de la tabla tools (catálogo de herramientas del SADMG). */
export const HERRAMIENTA = {
  CHAT: 1,
  LLUVIA_IDEAS: 2,
  CATEGORIZADOR: 3,
  COMENTADOR: 4,
  VOTACION: 5,
  PONDERACION: 6,
  MATRIZ: 7
} as const;

export type TopicoAgenda = typeof agenda.$inferSelect;

export async function listarAgenda(idproy: number): Promise<TopicoAgenda[]> {
  return db.select().from(agenda).where(eq(agenda.idproy, idproy)).orderBy(asc(agenda.id));
}

/**
 * Un tópico de categorización organiza las ideas de la lluvia de ideas que lo
 * precede en la agenda: el tópico de herramienta 2 más cercano con id menor.
 */
export function topicoOrigen(
  agendaProyecto: readonly TopicoAgenda[],
  categorizador: TopicoAgenda
): TopicoAgenda | undefined {
  return agendaProyecto
    .filter((t) => t.idtool === HERRAMIENTA.LLUVIA_IDEAS && t.id < categorizador.id)
    .sort((a, b) => b.id - a.id)[0];
}
