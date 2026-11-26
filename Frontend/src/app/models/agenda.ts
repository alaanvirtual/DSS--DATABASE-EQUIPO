export interface TopicoAgenda {
  idproy: number;
  id: number;
  topico: string;
  rol: string;
  idtool: number;
}

export const HERRAMIENTA = {
  CHAT: 1,
  LLUVIA_IDEAS: 2,
  CATEGORIZADOR: 3,
  COMENTADOR: 4,
  VOTACION: 5,
  PONDERACION: 6,
  MATRIZ: 7
} as const;
