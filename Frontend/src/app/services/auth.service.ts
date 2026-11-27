import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Usuario } from '../models/usuario';
import { SesionService } from './sesion.service';

const CLAVE = 'dss.usuario';

/**
 * Usuario autenticado del sistema.
 * Al iniciar sesión sincroniza el identificador con SesionService, de donde
 * leen las herramientas; al salir limpia la sesión completa.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  readonly usuario = signal<Usuario | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);

  constructor() {
    this.restaurar();
    effect(() => this.guardar(this.usuario()));
  }

  async login(credenciales: { usuario: string; passw: string }): Promise<Usuario> {
    const usuario = await firstValueFrom(
      this.http.post<Usuario>(`${environment.apiUrl}/auth/login`, credenciales)
    );

    this.usuario.set(usuario);
    this.sesion.idusuario.set(usuario.id);
    return usuario;
  }

  salir(): void {
    this.usuario.set(null);
    this.sesion.idproy.set(null);
    this.sesion.idusuario.set(null);
  }

  private restaurar(): void {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return;

      this.usuario.set(JSON.parse(crudo) as Usuario);
    } catch {
      /* sin almacenamiento disponible: se ignora */
    }
  }

  private guardar(usuario: Usuario | null): void {
    try {
      if (usuario) localStorage.setItem(CLAVE, JSON.stringify(usuario));
      else localStorage.removeItem(CLAVE);
    } catch {
      /* sin almacenamiento disponible: se ignora */
    }
  }
}
