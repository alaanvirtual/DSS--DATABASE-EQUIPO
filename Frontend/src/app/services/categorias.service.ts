import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Categoria } from '../models/categoria';
import { CategoriaDetalle } from '../models/categoria-detalle';

/** Acceso a la API de categorías (categorizer) y su detalle (categorizerdet). */
@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);

  private url(idproy: number): string {
    return `${environment.apiUrl}/proyectos/${idproy}/categorias`;
  }

  listar(idproy: number): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url(idproy));
  }

  crear(idproy: number, id: number, nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(this.url(idproy), { id, nombre });
  }

  renombrar(idproy: number, id: number, nombre: string): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.url(idproy)}/${id}`, { nombre });
  }

  eliminar(idproy: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(idproy)}/${id}`);
  }

  listarDetalle(idproy: number, idcat: number): Observable<CategoriaDetalle[]> {
    return this.http.get<CategoriaDetalle[]>(`${this.url(idproy)}/${idcat}/detalle`);
  }

  asignarIdea(
    idproy: number,
    idcat: number,
    idea: { idtopico: number; idusuario: number; id: number }
  ): Observable<CategoriaDetalle> {
    return this.http.post<CategoriaDetalle>(`${this.url(idproy)}/${idcat}/detalle`, {
      idtopico: idea.idtopico,
      idusuario: idea.idusuario,
      ididea: idea.id
    });
  }

  quitarIdea(
    idproy: number,
    idcat: number,
    idea: { idtopico: number; idusuario: number; id: number }
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.url(idproy)}/${idcat}/detalle/${idea.idtopico}/${idea.idusuario}/${idea.id}`
    );
  }
}
