import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ColumnaCategoria as DatosColumna } from '../../../models/categoria';
import { ArrastreIdea, IdeaConAutor } from '../../../models/idea';
import { leerArrastre } from '../../../utils/arrastre-idea';
import { claveIdea } from '../../../utils/clave-idea';
import { Boton } from '../../secundarios/boton/boton';
import { Insignia } from '../../secundarios/insignia/insignia';
import { TarjetaIdea } from '../tarjeta-idea/tarjeta-idea';

/**
 * Columna con una categoría y sus ideas, acepta ideas arrastradas
 * y permite renombrar, eliminar y quitar ideas.
 */
@Component({
  selector: 'app-columna-categoria',
  imports: [Boton, Insignia, TarjetaIdea],
  templateUrl: './columna-categoria.html',
  styleUrl: './columna-categoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnaCategoria {
  readonly columna = input.required<DatosColumna>();
  readonly editable = input(false);

  readonly soltar = output<ArrastreIdea>();
  readonly renombrar = output<void>();
  readonly eliminar = output<void>();
  readonly quitarIdea = output<IdeaConAutor>();

  protected readonly encima = signal(false);
  protected readonly claveIdea = claveIdea;

  protected alArrastrarSobre(evento: DragEvent): void {
    if (!this.editable()) return;
    evento.preventDefault();
    this.encima.set(true);
  }

  protected alSalir(evento: DragEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (!destino || !(evento.currentTarget as Node).contains(destino)) this.encima.set(false);
  }

  protected alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.encima.set(false);
    const arrastre = leerArrastre(evento.dataTransfer);
    if (arrastre && this.editable()) this.soltar.emit(arrastre);
  }
}
