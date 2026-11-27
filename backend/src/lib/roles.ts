/** Roles de un participante en un proyecto: facilitador o decisor. */
export type Rol = 'FAC' | 'DEC';

/** Indica si el rol de un tópico de la agenda ("FAC", "DEC" o "FAC, DEC") incluye al rol dado. */
export function rolIncluye(rolesAgenda: string, rol: string): boolean {
  return rolesAgenda.split(',').some((parte) => parte.trim() === rol);
}
