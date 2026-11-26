import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type VarianteInsignia = 'primario' | 'exito' | 'aviso' | 'info' | 'neutro';

/** Etiqueta pequeña de estado o conteo. Uso: <app-insignia variante="exito">FAC</app-insignia> */
@Component({
  selector: 'app-insignia',
  templateUrl: './insignia.html',
  styleUrl: './insignia.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Insignia {
  readonly variante = input<VarianteInsignia>('neutro');
}
