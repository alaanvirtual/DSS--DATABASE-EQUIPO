import type { Request, RequestHandler } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { agenda, categorizer, proyectosUsuarios } from '../db/schema';
import { ApiError } from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { exigirTopicoEditable } from '../lib/categorizador';
import { integerParam } from '../lib/params';
import { type Rol, rolIncluye } from '../lib/roles';
import { usuarioActual } from './auth';

type Metodo = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Roles permitidos para todos los métodos de escritura, o por método. */
export type ReglaEscritura = Rol[] | Partial<Record<Metodo, Rol[]>>;

const esLectura = (req: Request): boolean => ['GET', 'HEAD', 'OPTIONS'].includes(req.method);

/** Primer segmento de la ruta relativa al punto de montaje (p. ej. "/2/5" -> "2"). */
const segmento = (req: Request, posicion: number): string | undefined =>
  req.path.split('/')[posicion];

// ── Proyecto ────────────────────────────────────────────────────────────

/** Carga el rol del usuario en el proyecto :idproy. Responde 403 si no participa en él. */
export const requireParticipante: RequestHandler = asyncHandler(async (req, _res, next) => {
  const idproy = integerParam(req.params.idproy, 'idproy');

  const [participante] = await db
    .select({ rol: proyectosUsuarios.rol })
    .from(proyectosUsuarios)
    .where(and(eq(proyectosUsuarios.idproy, idproy), eq(proyectosUsuarios.idusu, usuarioActual(req).id)))
    .limit(1);

  if (!participante) throw new ApiError(403, 'No participas en este proyecto');

  req.rolProyecto = participante.rol as Rol;
  next();
});

/** Modificar o borrar el proyecto mismo (PATCH/DELETE /proyectos/:id) es del facilitador. */
export const soloFacilitadorEnElProyecto: RequestHandler = (req, _res, next) => {
  if (req.path === '/' && !esLectura(req) && req.rolProyecto !== 'FAC') {
    next(new ApiError(403, 'Solo el facilitador puede modificar el proyecto'));
    return;
  }

  next();
};

/** Las lecturas las puede hacer cualquier participante; la escritura, solo los roles indicados. */
export function permitirEscritura(regla: ReglaEscritura): RequestHandler {
  return (req, _res, next) => {
    if (esLectura(req)) {
      next();
      return;
    }

    const roles = Array.isArray(regla) ? regla : regla[req.method as Metodo];

    if (!roles || !req.rolProyecto || !roles.includes(req.rolProyecto)) {
      next(new ApiError(403, 'Tu rol en este proyecto no permite esta acción'));
      return;
    }

    next();
  };
}

/** El proyecto no puede quedarse sin facilitador: no se quita ni se degrada al último. */
export const conservarFacilitador: RequestHandler = asyncHandler(async (req, _res, next) => {
  const quita = req.method === 'DELETE';
  const degrada = req.method === 'PATCH' && (req.body as { rol?: unknown } | undefined)?.rol === 'DEC';

  if (!quita && !degrada) {
    next();
    return;
  }

  const idproy = integerParam(req.params.idproy, 'idproy');
  const idusu = integerParam(segmento(req, 1), 'idusu');

  const facilitadores = await db
    .select({ idusu: proyectosUsuarios.idusu })
    .from(proyectosUsuarios)
    .where(and(eq(proyectosUsuarios.idproy, idproy), eq(proyectosUsuarios.rol, 'FAC')));

  if (facilitadores.length <= 1 && facilitadores.some((f) => f.idusu === idusu)) {
    throw new ApiError(409, 'El proyecto debe conservar al menos un facilitador');
  }

  next();
});

// ── Agenda ──────────────────────────────────────────────────────────────

/**
 * El tópico debe usar la herramienta de la ruta (chat, lluvia de ideas...) y, para
 * escribir, el rol del usuario debe estar incluido en el rol del tópico de la agenda.
 */
export function topicoConHerramienta(herramienta: number): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const idproy = integerParam(req.params.idproy, 'idproy');
    const idtopico = integerParam(req.params.idtopico, 'idtopico');

    const [topico] = await db
      .select()
      .from(agenda)
      .where(and(eq(agenda.idproy, idproy), eq(agenda.id, idtopico)))
      .limit(1);

    if (!topico) throw new ApiError(404, 'Tópico de agenda no encontrado');
    if (topico.idtool !== herramienta) throw new ApiError(400, 'El tópico no usa esa herramienta');

    if (!esLectura(req) && (!req.rolProyecto || !rolIncluye(topico.rol, req.rolProyecto))) {
      throw new ApiError(403, 'La agenda no permite tu rol en este tópico');
    }

    next();
  });
}

// ── Autoría ─────────────────────────────────────────────────────────────

/**
 * Chat, ideas, comentarios y votos se escriben solo con el propio usuario. En el POST,
 * `idusuario` se completa con el del token si se omite; en PATCH/DELETE viene en la ruta.
 */
export const soloPropio: RequestHandler = (req, _res, next) => {
  if (esLectura(req)) {
    next();
    return;
  }

  const { id } = usuarioActual(req);
  let autor: unknown;

  if (req.method === 'POST') {
    const cuerpo = (req.body ?? {}) as Record<string, unknown>;
    cuerpo.idusuario ??= id;
    req.body = cuerpo;
    autor = cuerpo.idusuario;
  } else {
    autor = segmento(req, 1);
  }

  if (Number(autor) !== id) {
    next(new ApiError(403, 'Solo puedes actuar con tu propio usuario'));
    return;
  }

  next();
};

// ── Categorizador ───────────────────────────────────────────────────────

/**
 * Editar categorías o sus asignaciones: facilitador, y la agenda debe permitirlo en el
 * tópico al que pertenece la categoría (en el POST de una categoría, el que viene en el body).
 */
export const editaCategoria: RequestHandler = asyncHandler(async (req, _res, next) => {
  if (esLectura(req)) {
    next();
    return;
  }

  const idproy = integerParam(req.params.idproy, 'idproy');
  const textoCategoria = req.params.idcat ?? segmento(req, 1);
  let idtopico: number;

  if (!textoCategoria) {
    const valor = Number((req.body as { idtopico?: unknown } | undefined)?.idtopico);

    if (!Number.isInteger(valor)) {
      next(); // la validación del body responderá con el 400 correspondiente
      return;
    }

    idtopico = valor;
  } else {
    const idcat = integerParam(textoCategoria, 'idcat');

    const [categoria] = await db
      .select({ idtopico: categorizer.idtopico })
      .from(categorizer)
      .where(and(eq(categorizer.idproy, idproy), eq(categorizer.id, idcat)))
      .limit(1);

    if (!categoria) throw new ApiError(404, 'Categoría no encontrada');
    idtopico = categoria.idtopico;
  }

  await exigirTopicoEditable(req, idproy, idtopico);
  next();
});

// ── Catálogos globales ──────────────────────────────────────────────────

/** El catálogo de herramientas es de solo lectura vía API (se gestiona con seed/migraciones). */
export const soloLecturaCatalogo: RequestHandler = (req, _res, next) => {
  if (!esLectura(req)) {
    next(new ApiError(403, 'El catálogo de herramientas es de solo lectura'));
    return;
  }

  next();
};

/** Un usuario solo puede editar o borrar su propio registro. */
export const soloYo: RequestHandler = (req, _res, next) => {
  if (!esLectura(req) && Number(req.params.id) !== usuarioActual(req).id) {
    next(new ApiError(403, 'Solo puedes modificar tu propio usuario'));
    return;
  }

  next();
};
