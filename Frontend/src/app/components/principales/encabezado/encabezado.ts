import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../../secundarios/icono/icono';

/** Encabezado de la aplicación. El contenido proyectado se alinea a la derecha. */
@Component({
  selector: 'app-encabezado',
  imports: [Icono],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Encabezado {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | null>(null);
}
