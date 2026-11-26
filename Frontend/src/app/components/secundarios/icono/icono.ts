import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Ícono de Phosphor. Uso: <app-icono nombre="folder" /> (https://phosphoricons.com)
 * `relleno` usa la variante sólida (fill).
 */
@Component({
  selector: 'app-icono',
  templateUrl: './icono.html',
  styleUrl: './icono.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.font-size]': 'tamano()' }
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly relleno = input(false);
  readonly tamano = input('1.15em');

  protected readonly clase = computed(
    () => `${this.relleno() ? 'ph-fill' : 'ph'} ph-${this.nombre()}`
  );
}
