import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Boton } from '../../secundarios/boton/boton';

/**
 * Contenedor base de diálogos. Se muestra con @if desde el padre.
 * Contenido por defecto = cuerpo; usar el atributo `pie` para los botones:
 *   <app-modal titulo="..." (cerrar)="..."> cuerpo <div pie>botones</div> </app-modal>
 * Se cierra con Escape, con la X o al hacer clic fuera.
 */
@Component({
  selector: 'app-modal',
  imports: [Boton],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' }
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly cerrar = output<void>();
}
