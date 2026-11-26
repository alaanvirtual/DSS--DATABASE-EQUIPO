/** FAC = Facilitador, DEC = Decisor. */
export type Rol = 'FAC' | 'DEC';

export interface Participante {
  idproy: number;
  idusu: number;
  rol: Rol;
}
