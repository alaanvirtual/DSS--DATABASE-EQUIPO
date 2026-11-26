import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Proyecto } from '../models/proyecto';
import { Participante } from '../models/participante';
import { TopicoAgenda } from '../models/agenda';

@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/proyectos`;

  listar(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.base);
  }

  listarParticipantes(idproy: number): Observable<Participante[]> {
    return this.http.get<Participante[]>(`${this.base}/${idproy}/participantes`);
  }

  listarAgenda(idproy: number): Observable<TopicoAgenda[]> {
    return this.http.get<TopicoAgenda[]>(`${this.base}/${idproy}/agenda`);
  }
}
