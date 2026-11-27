import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icono } from '../icono/icono';

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';

/**
 * Botón del sistema. Escucha el clic en el propio <app-boton (click)="...">.
 * Para botones solo con ícono, activa `soloIcono` y da un `etiquetaAria`.
 * `cargando` muestra un spinner y bloquea el botón; `bloque` lo estira al ancho disponible.
 */
@Component({
  selector: 'app-boton',
  imports: [Icono],
  templateUrl: './boton.html',
  styleUrl: './boton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.deshabilitado]': 'deshabilitado() || cargando()',
    '[class.bloque]': 'bloque()'
  }
})
export class Boton {
  readonly variante = input<VarianteBoton>('secundario');
  readonly icono = input<string | null>(null);
  readonly tipo = input<'button' | 'submit'>('button');
  readonly deshabilitado = input(false);
  readonly cargando = input(false);
  readonly bloque = input(false);
  readonly grande = input(false);
  readonly soloIcono = input(false);
  readonly etiquetaAria = input<string | null>(null);
}
