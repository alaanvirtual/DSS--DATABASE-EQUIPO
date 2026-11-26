import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de carga con mensaje accesible. */
@Component({
  selector: 'app-cargando',
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Cargando {
  readonly mensaje = input('Cargando…');
}
