import { z } from 'zod';
import {
  dateString,
  estatus,
  id,
  pesoDecimal,
  rolAgenda,
  timeString,
  valorDecimal,
  votoPorcentaje
} from './common';

export const usuarioCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  telefono: z.string().max(20).nullish(),
  correo: z.string().trim().email().max(200),
  usuario: z.string().trim().min(1).max(100),
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

// En las tablas de llave compuesta el `id` es opcional: si no se envía, el servidor
// asigna el siguiente libre dentro del proyecto (o del tópico).
export const alternativaCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish()
});

export const alternativaUpdate = alternativaCreate.partial().omit({ id: true });

export const criterioCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish(),
  peso: pesoDecimal.nullish()
});

export const criterioUpdate = criterioCreate.partial().omit({ id: true });

export const matrizCreate = z.object({
  idalt: id,
  idcrit: id,
  valor: valorDecimal
});

export const matrizUpdate = z.object({
  valor: valorDecimal
});

export const toolCreate = z.object({
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(1000).nullish()
});

export const toolUpdate = toolCreate.partial().omit({ id: true });

export const agendaCreate = z.object({
  id: id.optional(),
  topico: z.string().min(1).max(100),
  rol: rolAgenda,
  idtool: id
});

export const agendaUpdate = agendaCreate.partial().omit({ id: true });

export const chatCreate = z.object({
  idusuario: id,
  id: id.optional(),
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
  id: id.optional(),
  nombre: z.string().min(1).max(100),
  objetivo: z.string().max(1000).nullish()
});

export const brainstormingUpdate = z.object({
  nombre: z.string().min(1).max(100).optional(),
  objetivo: z.string().max(1000).nullish()
});

// Cada categoría pertenece a un tópico de categorización de la agenda (idtopico),
// así el categorizador de alternativas y el de criterios no comparten categorías.
export const categoriaCreate = z.object({
  id: id.optional(),
  idtopico: id,
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

// idcat: categoría destino, o null para dejar la idea sin categorizar.
export const asignacionIdea = z.object({
  idcat: id.nullable()
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
  voto: votoPorcentaje
});

export const votingUpdate = z.object({
  voto: votoPorcentaje
});

export const loginSchema = z.object({
  usuario: z.string().trim().min(1).max(100),
  passw: z.string().min(1).max(100)
});
