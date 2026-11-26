import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IdeaConAutor } from '../../../models/idea';
import { OpcionSelect } from '../../../models/opcion-select';
import { guardarArrastre } from '../../../utils/arrastre-idea';
import { claveIdea } from '../../../utils/clave-idea';
import { Boton } from '../../secundarios/boton/boton';
import { CampoSelect } from '../../secundarios/campo-select/campo-select';
import { Icono } from '../../secundarios/icono/icono';
import { Insignia } from '../../secundarios/insignia/insignia';

/**
 * Representa una idea de la lluvia de ideas.
 * - variante "completa": tarjeta con detalle y selector (lista sin categorizar).
 * - variante "compacta": línea breve con botón de quitar (dentro de una categoría).
 * Si `editable`, se puede arrastrar hacia una columna de categoría.
 */
@Component({
  selector: 'app-tarjeta-idea',
  imports: [Boton, CampoSelect, Icono, Insignia],
  templateUrl: './tarjeta-idea.html',
  styleUrl: './tarjeta-idea.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.draggable]': 'editable()',
    '[class.arrastrable]': 'editable()',
    '(dragstart)': 'alArrastrar($event)'
  }
})
export class TarjetaIdea {
  readonly idea = input.required<IdeaConAutor>();
  readonly variante = input<'completa' | 'compacta'>('completa');
  readonly editable = input(false);
  /** Categorías a las que se puede mover (solo variante completa). */
  readonly destinos = input<readonly OpcionSelect[]>([]);
  /** Categoría donde está la idea, o null si no está categorizada. */
  readonly categoriaOrigen = input<number | null>(null);

  readonly mover = output<number>();
  readonly quitar = output<void>();

  protected alArrastrar(evento: DragEvent): void {
    if (!this.editable() || !evento.dataTransfer) return;
    guardarArrastre(evento.dataTransfer, {
      clave: claveIdea(this.idea()),
      origen: this.categoriaOrigen()
    });
  }

  protected alMover(idcat: number | null): void {
    if (idcat !== null) this.mover.emit(idcat);
  }
}
