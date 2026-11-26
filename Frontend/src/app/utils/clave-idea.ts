/**
 * Una idea se identifica por (idtopico, idusuario, id) dentro de un proyecto.
 * Esta clave de texto sirve para compararla y para el drag & drop.
 */
export function claveIdea(idea: { idtopico: number; idusuario: number; id: number }): string {
  return `${idea.idtopico}-${idea.idusuario}-${idea.id}`;
}

/** Clave de la idea a la que apunta una fila de categorizerdet. */
export function claveDeDetalle(detalle: {
  idtopico: number;
  idusuario: number;
  ididea: number;
}): string {
  return `${detalle.idtopico}-${detalle.idusuario}-${detalle.ididea}`;
}
