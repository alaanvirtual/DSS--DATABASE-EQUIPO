import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Idea } from '../models/idea';

@Injectable({ providedIn: 'root' })
export class BrainstormingService {
  private readonly http = inject(HttpClient);

  /** Ideas propuestas por los decisores en un tópico de lluvia de ideas. */
  listar(idproy: number, idtopico: number): Observable<Idea[]> {
    return this.http.get<Idea[]>(
      `${environment.apiUrl}/proyectos/${idproy}/agenda/${idtopico}/brainstorming`
    );
  }
}
