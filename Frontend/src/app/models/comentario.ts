import { Categoria } from './categoria';
import { IdeaConAutor } from './idea';
import { Rol } from './participante';

/** Comentario de un participante sobre una categoría (tabla comenter). */
export interface Comentario {
  idproy: number;
  idcat: number;
  idusuario: number;
  comentario: string;
}

/** Comentario enriquecido con el nombre, rol y si pertenece al usuario actual. */
export interface ComentarioConAutor extends Comentario {
  autor: string;
  rol: Rol | null;
  esPropio: boolean;
}

/** Categoría con sus ideas agrupadas y comentarios, lista para pintarse en el Comentador. */
export interface TarjetaCategoriaComentarios {
  categoria: Categoria;
  ideas: IdeaConAutor[];
  comentarios: ComentarioConAutor[];
  comentarioPropio: ComentarioConAutor | null;
}
