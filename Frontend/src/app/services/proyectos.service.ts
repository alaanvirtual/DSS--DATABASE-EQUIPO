import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Proyecto } from '../models/proyecto';
import { Participante, Rol } from '../models/participante';
import { TopicoAgenda } from '../models/agenda';

@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/proyectos`;

  listar(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.base);
  }

  crear(datos: Omit<Proyecto, 'id'>): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.base, datos);
  }

  listarParticipantes(idproy: number): Observable<Participante[]> {
    return this.http.get<Participante[]>(`${this.base}/${idproy}/participantes`);
  }

  agregarParticipante(idproy: number, participante: { idusu: number; rol: Rol }): Observable<Participante> {
    return this.http.post<Participante>(`${this.base}/${idproy}/participantes`, participante);
  }

  quitarParticipante(idproy: number, idusu: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idproy}/participantes/${idusu}`);
  }

  listarAgenda(idproy: number): Observable<TopicoAgenda[]> {
    return this.http.get<TopicoAgenda[]>(`${this.base}/${idproy}/agenda`);
  }

  agregarTopico(idproy: number, topico: Omit<TopicoAgenda, 'idproy'>): Observable<TopicoAgenda> {
    return this.http.post<TopicoAgenda>(`${this.base}/${idproy}/agenda`, topico);
  }

  quitarTopico(idproy: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idproy}/agenda/${id}`);
  }
}
