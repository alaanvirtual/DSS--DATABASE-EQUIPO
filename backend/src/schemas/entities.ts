import { z } from 'zod';
import { dateString, estatus, id, timeString } from './common';

export const usuarioCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  telefono: z.string().max(20).nullish(),
  correo: z.string().email().max(200),
  usuario: z.string().min(1).max(100),
  passw: z.string().min(1).max(100)
});

export const usuarioUpdate = usuarioCreate.partial().omit({ id: true });

export const proyectoCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  objetivo: z.string().max(1000).nullish(),
  fechainicio: dateString.nullish(),
  fechafin: dateString.nullish(),
  estatus
});

export const proyectoUpdate = proyectoCreate.partial().omit({ id: true });

export const participanteCreate = z.object({
  idusu: id,
  rol: z.enum(['FAC', 'DEC'])
});

export const participanteUpdate = z.object({
  rol: z.enum(['FAC', 'DEC'])
});

export const alternativaCreate = z.object({
  id: id,
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish()
});

export const alternativaUpdate = alternativaCreate.partial().omit({ id: true });

export const criterioCreate = z.object({
  id: id,
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish(),
  peso: z.coerce.number().finite().nullish()
});

export const criterioUpdate = criterioCreate.partial().omit({ id: true });

export const criterioPesoCreate = z.object({
  id: id,
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish(),
  peso: z.coerce.number().finite()
});

export const criterioPesoUpdate = criterioPesoCreate.partial().omit({ id: true });

export const matrizCreate = z.object({
  idalt: id,
  idcrit: id,
  valor: z.coerce.number().finite()
});

export const matrizUpdate = z.object({
  valor: z.coerce.number().finite()
});

export const toolCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish()
});

export const toolUpdate = toolCreate.partial().omit({ id: true });

export const agendaCreate = z.object({
  id: id,
  topico: z.string().min(1).max(100),
  rol: z.string().min(1).max(20),
  idtool: id
});

export const agendaUpdate = agendaCreate.partial().omit({ id: true });

export const chatCreate = z.object({
  idusuario: id,
  id: id,
  fecha: dateString,
  hora: timeString,
  mensaje: z.string().min(1).max(1000)
});

export const chatUpdate = z.object({
  fecha: dateString.optional(),
  hora: timeString.optional(),
  mensaje: z.string().min(1).max(1000).optional()
});

export const brainstormingCreate = z.object({
  idusuario: id,
  id: id,
  nombre: z.string().min(1).max(100),
  objetivo: z.string().max(1000).nullish()
});

export const brainstormingUpdate = z.object({
  nombre: z.string().min(1).max(100).optional(),
  objetivo: z.string().max(1000).nullish()
});

export const categoriaCreate = z.object({
  id: id,
  nombre: z.string().min(1).max(100)
});

export const categoriaUpdate = z.object({
  nombre: z.string().min(1).max(100)
});

export const categoriaDetalleCreate = z.object({
  idtopico: id,
  idusuario: id,
  ididea: id
});

export const comenterCreate = z.object({
  idusuario: id,
  comentario: z.string().min(1).max(1000)
});

export const comenterUpdate = z.object({
  comentario: z.string().min(1).max(1000)
});

export const votingCreate = z.object({
  idusuario: id,
  voto: z.coerce.number().finite().min(0).max(100)
});

export const votingUpdate = z.object({
  voto: z.coerce.number().finite().min(0).max(100)
});
