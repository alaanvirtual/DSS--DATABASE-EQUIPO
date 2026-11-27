import { Router } from 'express';
import { asc, eq, inArray } from 'drizzle-orm';
import type { MySqlColumn } from 'drizzle-orm/mysql-core';
import { createCrudRouter, type KeyColumn } from '../crud/createCrudRouter';
import { db } from '../db/client';
import {
  alternativas,
  agenda,
  brainstorming,
  categorizer,
  categorizerDet,
  chat,
  comenter,
  criterios,
  matrizValuada,
  proyectos,
  proyectosUsuarios,
  tools,
  usuarios,
  voting
} from '../db/schema';
import { validarAsignacion } from '../lib/categorizador';
import { hashPassword } from '../lib/password';
import { usuarioActual } from '../middleware/auth';
import {
  requireParticipante,
  soloFacilitadorEnElProyecto,
  soloLecturaCatalogo,
  soloYo
} from '../middleware/permisos';
import { requireParent } from '../middleware/requireParent';
import {
  agendaCreate,
  agendaUpdate,
  alternativaCreate,
  alternativaUpdate,
  brainstormingCreate,
  brainstormingUpdate,
  categoriaCreate,
  categoriaDetalleCreate,
  categoriaUpdate,
  chatCreate,
  chatUpdate,
  comenterCreate,
  comenterUpdate,
  criterioCreate,
  criterioUpdate,
  matrizCreate,
  matrizUpdate,
  participanteCreate,
  participanteUpdate,
  proyectoCreate,
  proyectoUpdate,
  toolCreate,
  toolUpdate,
  usuarioCreate,
  usuarioUpdate,
  votingCreate,
  votingUpdate
} from '../schemas/entities';

const key = (param: string, column: MySqlColumn): KeyColumn => ({ param, column });

// Los guardianes se registran antes que las rutas del factory para que se ejecuten primero.
const usuariosBase = Router({ mergeParams: true });
usuariosBase.use('/:id', soloYo);

export const usuariosRouter = createCrudRouter({
  table: usuarios,
  label: 'Usuario',
  createSchema: usuarioCreate,
  updateSchema: usuarioUpdate,
  pathKeys: [key('id', usuarios.id)],
  autoIdColumn: 'id',
  orderBy: [asc(usuarios.id)],
  router: usuariosBase,
  // La contraseña se guarda siempre hasheada y nunca se devuelve en las respuestas.
  transformBody: async (body) =>
    typeof body.passw === 'string' ? { ...body, passw: await hashPassword(body.passw) } : body,
  hiddenColumns: ['passw']
});

const toolsBase = Router({ mergeParams: true });
toolsBase.use(soloLecturaCatalogo);

export const toolsRouter = createCrudRouter({
  table: tools,
  label: 'Herramienta',
  createSchema: toolCreate,
  updateSchema: toolUpdate,
  pathKeys: [key('id', tools.id)],
  autoIdColumn: 'id',
  orderBy: [asc(tools.id)],
  router: toolsBase
});

// Todo lo que cuelga de /proyectos/:idproy exige que el proyecto exista (404) y que el
// usuario participe en él (403); modificar el proyecto mismo es del facilitador.
const proyectosBase = Router({ mergeParams: true });
proyectosBase.use(
  '/:idproy',
  requireParent(proyectos, 'Proyecto', [key('idproy', proyectos.id)]),
  requireParticipante,
  soloFacilitadorEnElProyecto
);

export const proyectosRouter = createCrudRouter({
  table: proyectos,
  label: 'Proyecto',
  createSchema: proyectoCreate,
  updateSchema: proyectoUpdate,
  pathKeys: [key('id', proyectos.id)],
  autoIdColumn: 'id',
  orderBy: [asc(proyectos.id)],
  router: proyectosBase,
  // Cada usuario solo ve los proyectos en los que participa.
  scopeWhere: (req) =>
    inArray(
      proyectos.id,
      db
        .select({ id: proyectosUsuarios.idproy })
        .from(proyectosUsuarios)
        .where(eq(proyectosUsuarios.idusu, usuarioActual(req).id))
    ),
  // Quien crea un proyecto queda como su facilitador, en la misma transacción.
  insertRow: (values, req) =>
    db.transaction(async (tx) => {
      const [resultado] = await tx.insert(proyectos).values(values as never);
      const idproy = Number(values.id ?? resultado.insertId);

      await tx
        .insert(proyectosUsuarios)
        .values({ idproy, idusu: usuarioActual(req).id, rol: 'FAC' });

      return idproy;
    })
});

const nested = () => Router({ mergeParams: true });

export const participantesRouter = createCrudRouter({
  table: proyectosUsuarios,
  label: 'Participante del proyecto',
  createSchema: participanteCreate,
  updateSchema: participanteUpdate,
  inheritedKeys: [key('idproy', proyectosUsuarios.idproy)],
  pathKeys: [key('idusu', proyectosUsuarios.idusu)],
  orderBy: [asc(proyectosUsuarios.idusu)],
  router: nested()
});

export const alternativasRouter = createCrudRouter({
  table: alternativas,
  label: 'Alternativa',
  createSchema: alternativaCreate,
  updateSchema: alternativaUpdate,
  inheritedKeys: [key('idproy', alternativas.idproy)],
  pathKeys: [key('id', alternativas.id)],
  serverId: { column: alternativas.id, scope: [alternativas.idproy] },
  orderBy: [asc(alternativas.id)],
  router: nested()
});

export const criteriosRouter = createCrudRouter({
  table: criterios,
  label: 'Criterio',
  createSchema: criterioCreate,
  updateSchema: criterioUpdate,
  inheritedKeys: [key('idproy', criterios.idproy)],
  pathKeys: [key('id', criterios.id)],
  serverId: { column: criterios.id, scope: [criterios.idproy] },
  orderBy: [asc(criterios.id)],
  router: nested()
});

export const matrizRouter = createCrudRouter({
  table: matrizValuada,
  label: 'Valoración de la matriz',
  createSchema: matrizCreate,
  updateSchema: matrizUpdate,
  inheritedKeys: [key('idproy', matrizValuada.idproy)],
  pathKeys: [key('idalt', matrizValuada.idalt), key('idcrit', matrizValuada.idcrit)],
  orderBy: [asc(matrizValuada.idalt), asc(matrizValuada.idcrit)],
  router: nested()
});

export const agendaRouter = createCrudRouter({
  table: agenda,
  label: 'Tópico de agenda',
  createSchema: agendaCreate,
  updateSchema: agendaUpdate,
  inheritedKeys: [key('idproy', agenda.idproy)],
  pathKeys: [key('id', agenda.id)],
  serverId: { column: agenda.id, scope: [agenda.idproy] },
  orderBy: [asc(agenda.id)],
  router: nested()
});

export const chatRouter = createCrudRouter({
  table: chat,
  label: 'Mensaje de chat',
  createSchema: chatCreate,
  updateSchema: chatUpdate,
  inheritedKeys: [key('idproy', chat.idproy), key('idtopico', chat.idtopico)],
  pathKeys: [key('idusuario', chat.idusuario), key('id', chat.id)],
  // El id del mensaje es único dentro del tópico (no por usuario).
  serverId: { column: chat.id, scope: [chat.idproy, chat.idtopico] },
  // Cronológico: el hilo de conversación debe leerse en orden de envío, no por usuario.
  orderBy: [asc(chat.fecha), asc(chat.hora), asc(chat.id), asc(chat.idusuario)],
  router: nested()
});

export const brainstormingRouter = createCrudRouter({
  table: brainstorming,
  label: 'Idea de brainstorming',
  createSchema: brainstormingCreate,
  updateSchema: brainstormingUpdate,
  inheritedKeys: [key('idproy', brainstorming.idproy), key('idtopico', brainstorming.idtopico)],
  pathKeys: [key('idusuario', brainstorming.idusuario), key('id', brainstorming.id)],
  // Las ideas se numeran por usuario dentro del tópico.
  serverId: {
    column: brainstorming.id,
    scope: [brainstorming.idproy, brainstorming.idtopico, brainstorming.idusuario]
  },
  orderBy: [asc(brainstorming.idusuario), asc(brainstorming.id)],
  router: nested()
});

export const categoriasRouter = createCrudRouter({
  table: categorizer,
  label: 'Categoría',
  createSchema: categoriaCreate,
  updateSchema: categoriaUpdate,
  inheritedKeys: [key('idproy', categorizer.idproy)],
  pathKeys: [key('id', categorizer.id)],
  queryFilters: [key('idtopico', categorizer.idtopico)],
  serverId: { column: categorizer.id, scope: [categorizer.idproy] },
  orderBy: [asc(categorizer.idtopico), asc(categorizer.id)],
  router: nested()
});

export const categoriaDetalleRouter = createCrudRouter({
  table: categorizerDet,
  label: 'Detalle de categoría',
  createSchema: categoriaDetalleCreate,
  inheritedKeys: [key('idproy', categorizerDet.idproy), key('idcat', categorizerDet.idcat)],
  pathKeys: [
    key('idtopico', categorizerDet.idtopico),
    key('idusuario', categorizerDet.idusuario),
    key('ididea', categorizerDet.ididea)
  ],
  beforeWrite: (values) => validarAsignacion(values),
  orderBy: [
    asc(categorizerDet.idtopico),
    asc(categorizerDet.idusuario),
    asc(categorizerDet.ididea)
  ],
  router: nested()
});

export const comentariosRouter = createCrudRouter({
  table: comenter,
  label: 'Comentario de categoría',
  createSchema: comenterCreate,
  updateSchema: comenterUpdate,
  inheritedKeys: [key('idproy', comenter.idproy), key('idcat', comenter.idcat)],
  pathKeys: [key('idusuario', comenter.idusuario)],
  orderBy: [asc(comenter.idusuario)],
  router: nested()
});

export const votosRouter = createCrudRouter({
  table: voting,
  label: 'Voto de categoría',
  createSchema: votingCreate,
  updateSchema: votingUpdate,
  inheritedKeys: [key('idproy', voting.idproy), key('idcat', voting.idcat)],
  pathKeys: [key('idusuario', voting.idusuario)],
  orderBy: [asc(voting.idusuario)],
  router: nested()
});
