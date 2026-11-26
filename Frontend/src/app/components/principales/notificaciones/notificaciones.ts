import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { Boton } from '../../secundarios/boton/boton';
import { Icono } from '../../secundarios/icono/icono';

/** Muestra los avisos de ToastService. Se coloca una sola vez en app.html. */
@Component({
  selector: 'app-notificaciones',
  imports: [Boton, Icono],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Notificaciones {
  protected readonly servicio = inject(ToastService);

  protected icono(tipo: string): string {
    return tipo === 'exito' ? 'check-circle' : tipo === 'error' ? 'warning-circle' : 'info';
  }
}
