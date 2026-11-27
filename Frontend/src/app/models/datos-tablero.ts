import { TopicoAgenda } from './agenda';
import { Categoria } from './categoria';
import { CategoriaDetalle } from './categoria-detalle';
import { Idea } from './idea';

/** Respuesta de GET /proyectos/:idproy/categorizador/:idtopico. */
export interface DatosTablero {
  topico: TopicoAgenda;
  /** Tópico de lluvia de ideas cuyas ideas se categorizan (null si no hay uno previo). */
  origen: TopicoAgenda | null;
  /** Si el usuario autenticado puede editar este tópico (facilitador y permitido por la agenda). */
  puedeEditar: boolean;
  ideas: Idea[];
  categorias: Categoria[];
  detalles: CategoriaDetalle[];
}
