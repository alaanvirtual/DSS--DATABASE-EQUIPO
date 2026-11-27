import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Categoria } from '../models/categoria';
import { DatosTablero } from '../models/datos-tablero';

/** Acceso a la API del Categorizador: categorías (categorizer) y asignación de ideas. */
@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);

  private url(idproy: number): string {
    return `${environment.apiUrl}/proyectos/${idproy}`;
  }

  /** Todo lo que necesita el tablero de un tópico categorizador, en una sola petición. */
  cargarTablero(idproy: number, idtopico: number): Observable<DatosTablero> {
    return this.http.get<DatosTablero>(`${this.url(idproy)}/categorizador/${idtopico}`);
  }

  /** El servidor asigna el id de la categoría. */
  crear(idproy: number, idtopico: number, nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.url(idproy)}/categorias`, { idtopico, nombre });
  }

  renombrar(idproy: number, id: number, nombre: string): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.url(idproy)}/categorias/${id}`, { nombre });
  }

  eliminar(idproy: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(idproy)}/categorias/${id}`);
  }

  /**
   * Mueve una idea a otra categoría, o la deja sin categorizar con `idcat = null`, en una
   * sola operación atómica (quita la asignación anterior y crea la nueva).
   */
  moverIdea(
    idproy: number,
    idea: { idtopico: number; idusuario: number; id: number },
    idcat: number | null
  ): Observable<{ idcat: number | null }> {
    return this.http.put<{ idcat: number | null }>(
      `${this.url(idproy)}/ideas/${idea.idtopico}/${idea.idusuario}/${idea.id}/categoria`,
      { idcat }
    );
  }
}
