import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloque gris animado que ocupa el lugar de un contenido mientras carga (skeleton).
 * Combina varios para imitar la forma de la pantalla final. Es decorativo: el
 * contenedor debe avisar la carga con role="status" y un texto para lectores de pantalla.
 *
 *   <app-esqueleto ancho="12rem" alto="1.2rem" />
 */
@Component({
  selector: 'app-esqueleto',
  template: '',
  styleUrl: './esqueleto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'ancho()',
    '[style.height]': 'alto()',
    '[style.border-radius]': 'radio()'
  }
})
export class Esqueleto {
  readonly ancho = input('100%');
  readonly alto = input('1rem');
  readonly radio = input('var(--radio-s)');
}
