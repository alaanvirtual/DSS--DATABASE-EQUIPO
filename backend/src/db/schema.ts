import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  decimal,
  foreignKey,
  index,
  mysqlTable,
  primaryKey,
  time,
  tinyint,
  unique,
  varchar
} from 'drizzle-orm/mysql-core';

// Este archivo es la fuente de verdad del esquema: Drizzle Kit genera las
// migraciones SQL (carpeta drizzle/) comparándolo con la versión anterior.
// Mantén sql/01_schema.sql solo como referencia legible.

const idColumn = () => bigint('id', { mode: 'number' });

export const usuarios = mysqlTable(
  'usuarios',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    telefono: varchar('telefono', { length: 20 }),
    correo: varchar('correo', { length: 200 }).notNull(),
    usuario: varchar('usuario', { length: 100 }).notNull(),
    // Hash scrypt (ver lib/password.ts), nunca la contraseña en claro.
    passw: varchar('passw', { length: 255 }).notNull()
  },
  (t) => [
    unique('uq_usuarios_usuario').on(t.usuario),
    unique('uq_usuarios_correo').on(t.correo)
  ]
);

export const proyectos = mysqlTable(
  'proyectos',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    objetivo: varchar('objetivo', { length: 1000 }),
    fechainicio: date('fechainicio', { mode: 'string' }),
    fechafin: date('fechafin', { mode: 'string' }),
    estatus: tinyint('estatus').notNull() // 1 = activo, 2 = cerrado
  },
  (t) => [check('ck_proyectos_estatus', sql`${t.estatus} IN (1, 2)`)]
);

export const proyectosUsuarios = mysqlTable(
  'proyectos_usuarios',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idusu: bigint('idusu', { mode: 'number' }).notNull(),
    rol: varchar('rol', { length: 3 }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idusu] }),
    check('ck_proy_usu_rol', sql`${t.rol} IN ('FAC', 'DEC')`),
    foreignKey({
      columns: [t.idproy],
      foreignColumns: [proyectos.id],
      name: 'fk_proy_usu_proyecto'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.idusu],
      foreignColumns: [usuarios.id],
      name: 'fk_proy_usu_usuario'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const alternativas = mysqlTable(
  'alternativas',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    id: idColumn().notNull(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    descripcion: varchar('descripcion', { length: 1000 })
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.id] }),
    foreignKey({
      columns: [t.idproy],
      foreignColumns: [proyectos.id],
      name: 'fk_alternativas_proyecto'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const criterios = mysqlTable(
  'criterios',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    id: idColumn().notNull(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    descripcion: varchar('descripcion', { length: 1000 }),
    peso: decimal('peso', { precision: 10, scale: 4, mode: 'number' })
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.id] }),
    foreignKey({
      columns: [t.idproy],
      foreignColumns: [proyectos.id],
      name: 'fk_criterios_proyecto'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const matrizValuada = mysqlTable(
  'matriz_valuada',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idalt: bigint('idalt', { mode: 'number' }).notNull(),
    idcrit: bigint('idcrit', { mode: 'number' }).notNull(),
    valor: decimal('valor', { precision: 10, scale: 4, mode: 'number' }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idalt, t.idcrit] }),
    foreignKey({
      columns: [t.idproy],
      foreignColumns: [proyectos.id],
      name: 'fk_matriz_proyecto'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.idproy, t.idalt],
      foreignColumns: [alternativas.idproy, alternativas.id],
      name: 'fk_matriz_alternativas'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.idproy, t.idcrit],
      foreignColumns: [criterios.idproy, criterios.id],
      name: 'fk_matriz_criterios'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const tools = mysqlTable('tools', {
  id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: varchar('descripcion', { length: 1000 })
});

export const agenda = mysqlTable(
  'agenda',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    id: idColumn().notNull(),
    topico: varchar('topico', { length: 100 }).notNull(),
    rol: varchar('rol', { length: 20 }).notNull(),
    idtool: bigint('idtool', { mode: 'number' }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.id] }),
    foreignKey({
      columns: [t.idproy],
      foreignColumns: [proyectos.id],
      name: 'fk_agenda_proyecto'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.idtool],
      foreignColumns: [tools.id],
      name: 'fk_agenda_tool'
    })
      .onDelete('restrict')
      .onUpdate('cascade')
  ]
);

export const chat = mysqlTable(
  'chat',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idtopico: bigint('idtopico', { mode: 'number' }).notNull(),
    idusuario: bigint('idusuario', { mode: 'number' }).notNull(),
    id: idColumn().notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    hora: time('hora').notNull(),
    mensaje: varchar('mensaje', { length: 1000 }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idtopico, t.idusuario, t.id] }),
    foreignKey({
      columns: [t.idproy, t.idtopico],
      foreignColumns: [agenda.idproy, agenda.id],
      name: 'fk_chat_agenda'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_chat_participante').on(t.idproy, t.idusuario),
    foreignKey({
      columns: [t.idproy, t.idusuario],
      foreignColumns: [proyectosUsuarios.idproy, proyectosUsuarios.idusu],
      name: 'fk_chat_participante'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const brainstorming = mysqlTable(
  'brainstorming',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idtopico: bigint('idtopico', { mode: 'number' }).notNull(),
    idusuario: bigint('idusuario', { mode: 'number' }).notNull(),
    id: idColumn().notNull(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    objetivo: varchar('objetivo', { length: 1000 })
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idtopico, t.idusuario, t.id] }),
    foreignKey({
      columns: [t.idproy, t.idtopico],
      foreignColumns: [agenda.idproy, agenda.id],
      name: 'fk_brainstorming_agenda'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_brainstorming_participante').on(t.idproy, t.idusuario),
    foreignKey({
      columns: [t.idproy, t.idusuario],
      foreignColumns: [proyectosUsuarios.idproy, proyectosUsuarios.idusu],
      name: 'fk_brainstorming_participante'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const categorizer = mysqlTable(
  'categorizer',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    id: idColumn().notNull(),
    // Tópico de la agenda (herramienta 3) al que pertenece la categoría.
    idtopico: bigint('idtopico', { mode: 'number' }).notNull(),
    nombre: varchar('nombre', { length: 100 }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.id] }),
    unique('uq_categorizer_nombre').on(t.idproy, t.idtopico, t.nombre),
    foreignKey({
      columns: [t.idproy],
      foreignColumns: [proyectos.id],
      name: 'fk_categorizer_proyecto'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.idproy, t.idtopico],
      foreignColumns: [agenda.idproy, agenda.id],
      name: 'fk_categorizer_agenda'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const categorizerDet = mysqlTable(
  'categorizerdet',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idcat: bigint('idcat', { mode: 'number' }).notNull(),
    idtopico: bigint('idtopico', { mode: 'number' }).notNull(),
    idusuario: bigint('idusuario', { mode: 'number' }).notNull(),
    ididea: bigint('ididea', { mode: 'number' }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idcat, t.idtopico, t.idusuario, t.ididea] }),
    foreignKey({
      columns: [t.idproy, t.idcat],
      foreignColumns: [categorizer.idproy, categorizer.id],
      name: 'fk_catdet_categorizer'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.idproy, t.idtopico, t.idusuario, t.ididea],
      foreignColumns: [brainstorming.idproy, brainstorming.idtopico, brainstorming.idusuario, brainstorming.id],
      name: 'fk_catdet_brainstorming'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const comenter = mysqlTable(
  'comenter',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idcat: bigint('idcat', { mode: 'number' }).notNull(),
    idusuario: bigint('idusuario', { mode: 'number' }).notNull(),
    comentario: varchar('comentario', { length: 1000 }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idcat, t.idusuario] }),
    foreignKey({
      columns: [t.idproy, t.idcat],
      foreignColumns: [categorizer.idproy, categorizer.id],
      name: 'fk_comenter_categorizer'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_comenter_participante').on(t.idproy, t.idusuario),
    foreignKey({
      columns: [t.idproy, t.idusuario],
      foreignColumns: [proyectosUsuarios.idproy, proyectosUsuarios.idusu],
      name: 'fk_comenter_participante'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);

export const voting = mysqlTable(
  'voting',
  {
    idproy: bigint('idproy', { mode: 'number' }).notNull(),
    idcat: bigint('idcat', { mode: 'number' }).notNull(),
    idusuario: bigint('idusuario', { mode: 'number' }).notNull(),
    voto: decimal('voto', { precision: 5, scale: 2, mode: 'number' }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.idproy, t.idcat, t.idusuario] }),
    foreignKey({
      columns: [t.idproy, t.idcat],
      foreignColumns: [categorizer.idproy, categorizer.id],
      name: 'fk_voting_categorizer'
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_voting_participante').on(t.idproy, t.idusuario),
    check('ck_voting_voto', sql`${t.voto} BETWEEN 0 AND 100`),
    foreignKey({
      columns: [t.idproy, t.idusuario],
      foreignColumns: [proyectosUsuarios.idproy, proyectosUsuarios.idusu],
      name: 'fk_voting_participante'
    })
      .onDelete('cascade')
      .onUpdate('cascade')
  ]
);
