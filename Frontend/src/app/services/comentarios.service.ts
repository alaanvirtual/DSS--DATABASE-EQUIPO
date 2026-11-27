import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Comentario } from '../models/comentario';

/** Acceso a la API de comentarios por categoría (tabla comenter). */
@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private readonly http = inject(HttpClient);

  private url(idproy: number, idcat: number): string {
    return `${environment.apiUrl}/proyectos/${idproy}/categorias/${idcat}/comentarios`;
  }

  listar(idproy: number, idcat: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(this.url(idproy, idcat));
  }

  crear(idproy: number, idcat: number, idusuario: number, comentario: string): Observable<Comentario> {
    return this.http.post<Comentario>(this.url(idproy, idcat), { idusuario, comentario });
  }

  actualizar(
    idproy: number,
    idcat: number,
    idusuario: number,
    comentario: string
  ): Observable<Comentario> {
    return this.http.patch<Comentario>(`${this.url(idproy, idcat)}/${idusuario}`, { comentario });
  }

  eliminar(idproy: number, idcat: number, idusuario: number): Observable<void> {
    return this.http.delete<void>(`${this.url(idproy, idcat)}/${idusuario}`);
  }
}
