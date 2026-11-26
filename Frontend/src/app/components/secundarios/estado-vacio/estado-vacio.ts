import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

/** Mensaje para listas o pantallas sin contenido. El contenido proyectado es la acción opcional. */
@Component({
  selector: 'app-estado-vacio',
  imports: [Icono],
  templateUrl: './estado-vacio.html',
  styleUrl: './estado-vacio.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadoVacio {
  readonly icono = input('tray');
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null>(null);
}
