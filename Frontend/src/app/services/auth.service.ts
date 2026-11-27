import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../auth/environment/environment';
import { Usuario } from '../models/usuario';
import { expiracionDelToken } from '../utils/token-jwt';
import { SesionService } from './sesion.service';

const CLAVE_USUARIO = 'dss.usuario';
const CLAVE_TOKEN = 'dss.token';

/**
 * Usuario autenticado del sistema.
 * Al iniciar sesión guarda el token (JWT) que el interceptor envía en cada petición y
 * sincroniza el identificador con SesionService, de donde leen las herramientas;
 * al salir limpia la sesión completa.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  readonly usuario = signal<Usuario | null>(null);
  readonly token = signal<string | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null && this.token() !== null);
  /** Instante (ms) en que vence la sesión actual, o null si no hay sesión. */
  readonly expiraEn = computed(() => {
    const token = this.token();
    return token ? expiracionDelToken(token) : null;
  });

  constructor() {
    this.restaurar();
    effect(() => this.guardar(this.usuario(), this.token()));
  }

  async login(credenciales: { usuario: string; passw: string }): Promise<Usuario> {
    const respuesta = await firstValueFrom(
      this.http.post<{ token: string; usuario: Usuario }>(
        `${environment.apiUrl}/auth/login`,
        credenciales
      )
    );

    this.token.set(respuesta.token);
    this.usuario.set(respuesta.usuario);
    this.sesion.idusuario.set(respuesta.usuario.id);
    return respuesta.usuario;
  }

  /** Pide un token nuevo mientras el actual siga vigente (un token vencido no se puede renovar). */
  async renovar(): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<{ token: string; usuario: Usuario }>(`${environment.apiUrl}/auth/refresh`, {})
    );

    this.token.set(respuesta.token);
    this.usuario.set(respuesta.usuario);
  }

  salir(): void {
    this.usuario.set(null);
    this.token.set(null);
    this.sesion.idproy.set(null);
    this.sesion.idusuario.set(null);
  }

  private restaurar(): void {
    try {
      const usuario = localStorage.getItem(CLAVE_USUARIO);
      const token = localStorage.getItem(CLAVE_TOKEN);

      // Una sesión sin token (de una versión anterior) no sirve: hay que volver a iniciar.
      if (!usuario || !token) return;

      this.usuario.set(JSON.parse(usuario) as Usuario);
      this.token.set(token);
    } catch {
      /* sin almacenamiento disponible: se ignora */
    }
  }

  private guardar(usuario: Usuario | null, token: string | null): void {
    try {
      if (usuario && token) {
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
        localStorage.setItem(CLAVE_TOKEN, token);
      } else {
        localStorage.removeItem(CLAVE_USUARIO);
        localStorage.removeItem(CLAVE_TOKEN);
      }
    } catch {
      /* sin almacenamiento disponible: se ignora */
    }
  }
}
