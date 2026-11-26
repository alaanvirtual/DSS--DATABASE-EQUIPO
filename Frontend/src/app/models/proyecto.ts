export interface Proyecto {
  id: number;
  nombre: string;
  objetivo: string | null;
  fechainicio: string | null;
  fechafin: string | null;
  estatus: number;
}
