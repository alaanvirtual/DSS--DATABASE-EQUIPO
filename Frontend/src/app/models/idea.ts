/** Idea generada en la lluvia de ideas (tabla brainstorming). */
export interface Idea {
  idproy: number;
  idtopico: number;
  idusuario: number;
  id: number;
  nombre: string;
  objetivo: string | null;
}

/** Idea enriquecida con el nombre de quien la propuso, lista para mostrarse. */
export interface IdeaConAutor extends Idea {
  autor: string;
}

/** Información que viaja en un arrastre (drag & drop) de una idea. */
export interface ArrastreIdea {
  /** Clave única de la idea, ver utils/clave-idea.ts */
  clave: string;
  /** Categoría de la que se arrastra, o null si viene de "sin categorizar". */
  origen: number | null;
}
