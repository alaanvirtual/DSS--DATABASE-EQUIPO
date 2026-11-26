import { IdeaConAutor } from './idea';

/** Categoría consolidada por el facilitador (tabla categorizer). */
export interface Categoria {
  idproy: number;
  id: number;
  nombre: string;
}

/** Una categoría con las ideas que contiene, lista para pintarse como columna. */
export interface ColumnaCategoria {
  categoria: Categoria;
  ideas: IdeaConAutor[];
}
