import type { Request } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { agenda, categorizer, categorizerDet } from '../db/schema';
import { ApiError } from './ApiError';
import { rolIncluye } from './roles';
import { HERRAMIENTA, type TopicoAgenda, listarAgenda, topicoOrigen } from './topicos';

/**
 * Exige que el tópico sea un categorizador de la agenda y que el usuario pueda
 * editarlo: facilitador del proyecto y rol FAC incluido en el tópico de la agenda.
 */
export async function exigirTopicoEditable(
  req: Request,
  idproy: number,
  idtopico: number
): Promise<TopicoAgenda> {
  const [topico] = await db
    .select()
    .from(agenda)
    .where(and(eq(agenda.idproy, idproy), eq(agenda.id, idtopico)))
    .limit(1);

  if (!topico) throw new ApiError(404, 'Tópico de agenda no encontrado');

  if (topico.idtool !== HERRAMIENTA.CATEGORIZADOR) {
    throw new ApiError(400, 'El tópico no usa la herramienta Categorizador');
  }

  if (req.rolProyecto !== 'FAC' || !rolIncluye(topico.rol, 'FAC')) {
    throw new ApiError(403, 'La agenda no permite al facilitador editar este tópico');
  }

  return topico;
}

/**
 * Valida la asignación de una idea a una categoría (POST .../detalle):
 * la idea debe pertenecer a la lluvia de ideas que organiza la categoría y no
 * puede estar ya en otra categoría (para moverla se usa el endpoint PUT).
 */
export async function validarAsignacion(values: Record<string, unknown>): Promise<void> {
  const idproy = Number(values.idproy);
  const idcat = Number(values.idcat);
  const idtopico = Number(values.idtopico);
  const idusuario = Number(values.idusuario);
  const ididea = Number(values.ididea);

  const [categoria] = await db
    .select()
    .from(categorizer)
    .where(and(eq(categorizer.idproy, idproy), eq(categorizer.id, idcat)))
    .limit(1);

  if (!categoria) throw new ApiError(404, 'Categoría no encontrada');

  const agendaProyecto = await listarAgenda(idproy);
  const topicoCategoria = agendaProyecto.find((t) => t.id === categoria.idtopico);
  const origen = topicoCategoria ? topicoOrigen(agendaProyecto, topicoCategoria) : undefined;

  if (origen?.id !== idtopico) {
    throw new ApiError(400, 'La idea no pertenece al tópico que organiza esta categoría');
  }

  const existentes = await db
    .select({ idcat: categorizerDet.idcat })
    .from(categorizerDet)
    .where(
      and(
        eq(categorizerDet.idproy, idproy),
        eq(categorizerDet.idtopico, idtopico),
        eq(categorizerDet.idusuario, idusuario),
        eq(categorizerDet.ididea, ididea)
      )
    );

  if (existentes.length > 0) {
    throw new ApiError(
      409,
      'La idea ya está en una categoría; para moverla usa PUT /ideas/:idtopico/:idusuario/:ididea/categoria'
    );
  }
}
