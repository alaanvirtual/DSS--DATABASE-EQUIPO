import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { asyncHandler } from '../lib/asyncHandler';
import { integerParam } from '../lib/params';
import { rawRows } from '../lib/rawRows';

type ScoringRow = {
  id_alternativa: number | string;
  alternativa: string;
  descripcion: string | null;
  puntaje_scoring_total: number | string;
};

export const scoringRouter = Router({ mergeParams: true });

scoringRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const idproy = integerParam(req.params.idproy, 'idproy');

    const rows = await rawRows<ScoringRow>(
      sql`
        SELECT
          alt.id AS id_alternativa,
          alt.nombre AS alternativa,
          alt.descripcion,
          ROUND(SUM(mv.valor * COALESCE(c.peso, 0)), 4) AS puntaje_scoring_total
        FROM matriz_valuada mv
        INNER JOIN alternativas alt ON mv.idproy = alt.idproy AND mv.idalt = alt.id
        INNER JOIN criterios c ON mv.idproy = c.idproy AND mv.idcrit = c.id
        WHERE mv.idproy = ${idproy}
        GROUP BY alt.id, alt.nombre, alt.descripcion
        ORDER BY puntaje_scoring_total DESC
      `
    );

    res.json({
      idproy,
      ranking: rows.map((row) => ({
        id_alternativa: Number(row.id_alternativa),
        alternativa: row.alternativa,
        descripcion: row.descripcion,
        puntaje_scoring_total: Number(row.puntaje_scoring_total)
      }))
    });
  })
);
