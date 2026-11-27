import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Boton } from '../../secundarios/boton/boton';
import { Icono } from '../../secundarios/icono/icono';

/** Cuánto antes del vencimiento se avisa al usuario. */
const AVISAR_ANTES_MS = 2 * 60 * 1000;

/**
 * Avisa unos minutos antes de que venza la sesión y permite renovarla sin perder el
 * trabajo. Si la sesión vence, la cierra y lleva al login. Colócalo una vez, en la raíz.
 */
@Component({
  selector: 'app-aviso-sesion',
  imports: [Boton, Icono],
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvisoSesion {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly ahora = signal(Date.now());
  protected readonly renovando = signal(false);

  /** Milisegundos que le quedan a la sesión, o null si no hay sesión. */
  private readonly restanteMs = computed(() => {
    const vence = this.auth.expiraEn();
    return this.auth.autenticado() && vence !== null ? vence - this.ahora() : null;
  });

  protected readonly visible = computed(() => {
    const restante = this.restanteMs();
    return restante !== null && restante > 0 && restante <= AVISAR_ANTES_MS;
  });

  /** Tiempo restante como m:ss. */
  protected readonly tiempo = computed(() => {
    const segundos = Math.max(0, Math.ceil((this.restanteMs() ?? 0) / 1000));
    return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
  });

  constructor() {
    const reloj = setInterval(() => this.ahora.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    effect(() => {
      const restante = this.restanteMs();
      if (restante !== null && restante <= 0) untracked(() => this.terminar());
    });
  }

  protected async renovar(): Promise<void> {
    this.renovando.set(true);

    try {
      await this.auth.renovar();
      this.toast.exito('Sesión renovada');
    } catch {
      this.toast.error('No se pudo renovar la sesión. Guarda tu trabajo e inicia sesión de nuevo.');
    } finally {
      this.renovando.set(false);
    }
  }

  protected salir(): void {
    this.auth.salir();
    void this.router.navigate(['/login']);
  }

  /** La sesión venció: se cierra y se avisa en el login. */
  private terminar(): void {
    this.auth.salir();
    void this.router.navigate(['/login'], { queryParams: { motivo: 'expirada' } });
  }
}
