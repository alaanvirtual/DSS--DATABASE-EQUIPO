import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Usuario } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  /** Lista los usuarios descartando explícitamente la contraseña que devuelve la API. */
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`).pipe(
      map((usuarios) =>
        usuarios.map(({ id, nombre, telefono, correo, usuario }) => ({
          id,
          nombre,
          telefono,
          correo,
          usuario
        }))
      )
    );
  }
}
