import { IdeaConAutor } from './idea';

/**
 * Categoría consolidada por el facilitador (tabla categorizer).
 * Pertenece a un tópico de categorización de la agenda (idtopico); el id es único en el proyecto.
 */
export interface Categoria {
  idproy: number;
  id: number;
  idtopico: number;
  nombre: string;
}

/** Una categoría con las ideas que contiene, lista para pintarse como columna. */
export interface ColumnaCategoria {
  categoria: Categoria;
  ideas: IdeaConAutor[];
}
