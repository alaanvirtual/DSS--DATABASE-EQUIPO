import { Router } from 'express';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { brainstorming, categorizer, categorizerDet } from '../db/schema';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { exigirTopicoEditable } from '../lib/categorizador';
import { integerParam } from '../lib/params';
import { rolIncluye } from '../lib/roles';
import { HERRAMIENTA, listarAgenda, topicoOrigen } from '../lib/topicos';
import { validate } from '../middleware/validate';
import { asignacionIdea } from '../schemas/entities';

// Se monta en /api/proyectos/:idproy (tras requireParticipante).
export const categorizadorRouter = Router({ mergeParams: true });

/**
 * Todo lo que necesita el tablero de un tópico categorizador en una sola petición:
 * el tópico, la lluvia de ideas que organiza, sus categorías y las asignaciones.
 */
categorizadorRouter.get(
  '/categorizador/:idtopico',
  asyncHandler(async (req, res) => {
    const idproy = integerParam(req.params.idproy, 'idproy');
    const idtopico = integerParam(req.params.idtopico, 'idtopico');

    const agendaProyecto = await listarAgenda(idproy);
    const topico = agendaProyecto.find((t) => t.id === idtopico);

    if (!topico) throw new ApiError(404, 'Tópico de agenda no encontrado');

    if (topico.idtool !== HERRAMIENTA.CATEGORIZADOR) {
      throw new ApiError(400, 'El tópico no usa la herramienta Categorizador');
    }

    const origen = topicoOrigen(agendaProyecto, topico) ?? null;

    const ideas = origen
      ? await db
          .select()
          .from(brainstorming)
          .where(and(eq(brainstorming.idproy, idproy), eq(brainstorming.idtopico, origen.id)))
          .orderBy(asc(brainstorming.idusuario), asc(brainstorming.id))
      : [];

    const categorias = await db
      .select()
      .from(categorizer)
      .where(and(eq(categorizer.idproy, idproy), eq(categorizer.idtopico, idtopico)))
      .orderBy(asc(categorizer.id));

    const detalles =
      categorias.length === 0
        ? []
        : await db
            .select()
            .from(categorizerDet)
            .where(
              and(
                eq(categorizerDet.idproy, idproy),
                inArray(
                  categorizerDet.idcat,
                  categorias.map((c) => c.id)
                )
              )
            )
            .orderBy(
              asc(categorizerDet.idcat),
              asc(categorizerDet.idusuario),
              asc(categorizerDet.ididea)
            );

    res.json({
      topico,
      origen,
      puedeEditar: req.rolProyecto === 'FAC' && rolIncluye(topico.rol, 'FAC'),
      ideas,
      categorias,
      detalles
    });
  })
);

/**
 * Mueve una idea a otra categoría (o la deja sin categorizar con { "idcat": null }) en una
 * sola operación atómica: se borra la asignación anterior y se crea la nueva.
 */
categorizadorRouter.put(
  '/ideas/:idtopico/:idusuario/:ididea/categoria',
  validate(asignacionIdea),
  asyncHandler(async (req, res) => {
    const idproy = integerParam(req.params.idproy, 'idproy');
    const idtopico = integerParam(req.params.idtopico, 'idtopico');
    const idusuario = integerParam(req.params.idusuario, 'idusuario');
    const ididea = integerParam(req.params.ididea, 'ididea');
    const { idcat } = req.body as { idcat: number | null };

    if (req.rolProyecto !== 'FAC') {
      throw new ApiError(403, 'Solo el facilitador puede categorizar ideas');
    }

    const [idea] = await db
      .select({ id: brainstorming.id })
      .from(brainstorming)
      .where(
        and(
          eq(brainstorming.idproy, idproy),
          eq(brainstorming.idtopico, idtopico),
          eq(brainstorming.idusuario, idusuario),
          eq(brainstorming.id, ididea)
        )
      )
      .limit(1);

    if (!idea) throw new ApiError(404, 'Idea no encontrada');

    const claveIdea = and(
      eq(categorizerDet.idproy, idproy),
      eq(categorizerDet.idtopico, idtopico),
      eq(categorizerDet.idusuario, idusuario),
      eq(categorizerDet.ididea, ididea)
    );

    if (idcat !== null) {
      const [categoria] = await db
        .select({ idtopico: categorizer.idtopico })
        .from(categorizer)
        .where(and(eq(categorizer.idproy, idproy), eq(categorizer.id, idcat)))
        .limit(1);

      if (!categoria) throw new ApiError(404, 'Categoría no encontrada');

      const topicoCategoria = await exigirTopicoEditable(req, idproy, categoria.idtopico);
      const origen = topicoOrigen(await listarAgenda(idproy), topicoCategoria);

      if (origen?.id !== idtopico) {
        throw new ApiError(400, 'La idea no pertenece al tópico que organiza esta categoría');
      }
    } else {
      // Quitarla de su categoría actual también exige poder editar ese tópico.
      const actuales = await db
        .select({ idcat: categorizerDet.idcat })
        .from(categorizerDet)
        .where(claveIdea);

      for (const actual of actuales) {
        const [categoria] = await db
          .select({ idtopico: categorizer.idtopico })
          .from(categorizer)
          .where(and(eq(categorizer.idproy, idproy), eq(categorizer.id, actual.idcat)))
          .limit(1);

        if (categoria) await exigirTopicoEditable(req, idproy, categoria.idtopico);
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(categorizerDet).where(claveIdea);

      if (idcat !== null) {
        await tx.insert(categorizerDet).values({ idproy, idcat, idtopico, idusuario, ididea });
      }
    });

    res.json({ idproy, idtopico, idusuario, ididea, idcat });
  })
);
