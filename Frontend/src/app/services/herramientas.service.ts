import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Herramienta } from '../models/herramienta';

@Injectable({ providedIn: 'root' })
export class HerramientasService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Herramienta[]> {
    return this.http.get<Herramienta[]>(`${environment.apiUrl}/tools`);
  }
}
