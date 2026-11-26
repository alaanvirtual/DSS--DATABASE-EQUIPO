import { Router } from 'express';
import { asc } from 'drizzle-orm';
import type { MySqlColumn } from 'drizzle-orm/mysql-core';
import { createCrudRouter, type KeyColumn } from '../crud/createCrudRouter';
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

export const usuariosRouter = createCrudRouter({
  table: usuarios,
  label: 'Usuario',
  createSchema: usuarioCreate,
  updateSchema: usuarioUpdate,
  pathKeys: [key('id', usuarios.id)],
  autoIdColumn: 'id',
  orderBy: [asc(usuarios.id)]
});

export const toolsRouter = createCrudRouter({
  table: tools,
  label: 'Herramienta',
  createSchema: toolCreate,
  updateSchema: toolUpdate,
  pathKeys: [key('id', tools.id)],
  autoIdColumn: 'id',
  orderBy: [asc(tools.id)]
});

export const proyectosRouter = createCrudRouter({
  table: proyectos,
  label: 'Proyecto',
  createSchema: proyectoCreate,
  updateSchema: proyectoUpdate,
  pathKeys: [key('id', proyectos.id)],
  autoIdColumn: 'id',
  orderBy: [asc(proyectos.id)]
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
  orderBy: [asc(chat.idusuario), asc(chat.id)],
  router: nested()
});

export const brainstormingRouter = createCrudRouter({
  table: brainstorming,
  label: 'Idea de brainstorming',
  createSchema: brainstormingCreate,
  updateSchema: brainstormingUpdate,
  inheritedKeys: [key('idproy', brainstorming.idproy), key('idtopico', brainstorming.idtopico)],
  pathKeys: [key('idusuario', brainstorming.idusuario), key('id', brainstorming.id)],
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
  orderBy: [asc(categorizer.id)],
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
