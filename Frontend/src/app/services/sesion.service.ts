import { Injectable, effect, signal } from '@angular/core';

const CLAVE = 'dss.sesion';

/**
 * Contexto de trabajo actual (proyecto y usuario).
 * Es provisional: cuando exista el login del sistema, el usuario saldrá de allí.
 * Se recuerda en localStorage solo por comodidad; si no está disponible, no pasa nada.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  readonly idproy = signal<number | null>(null);
  readonly idusuario = signal<number | null>(null);

  constructor() {
    this.restaurar();
    effect(() => this.guardar(this.idproy(), this.idusuario()));
  }

  private restaurar(): void {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return;

      const datos = JSON.parse(crudo) as { idproy?: number | null; idusuario?: number | null };
      this.idproy.set(datos.idproy ?? null);
      this.idusuario.set(datos.idusuario ?? null);
    } catch {
      /* sin almacenamiento disponible: se ignora */
    }
  }

  private guardar(idproy: number | null, idusuario: number | null): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ idproy, idusuario }));
    } catch {
      /* sin almacenamiento disponible: se ignora */
    }
  }
}
