import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { OpcionSelect } from '../../../models/opcion-select';
import { Icono } from '../icono/icono';

/**
 * Lista desplegable con etiqueta. Soporta enlace bidireccional: [(valor)]="señal".
 * `valor` es null cuando está seleccionado el marcador (placeholder).
 */
@Component({
  selector: 'app-campo-select',
  imports: [Icono],
  templateUrl: './campo-select.html',
  styleUrl: './campo-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampoSelect {
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<readonly OpcionSelect[]>();
  readonly marcador = input<string | null>(null);
  readonly deshabilitado = input(false);
  readonly ocultarEtiqueta = input(false);
  readonly valor = model<number | null>(null);

  protected cambiar(evento: Event): void {
    const texto = (evento.target as HTMLSelectElement).value;
    this.valor.set(texto === '' ? null : Number(texto));
  }
}
