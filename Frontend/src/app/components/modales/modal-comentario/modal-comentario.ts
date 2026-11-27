import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output
} from '@angular/core';
import { Boton } from '../../secundarios/boton/boton';
import { CampoArea } from '../../secundarios/campo-area/campo-area';
import { Modal } from '../modal/modal';

/** Diálogo para capturar o editar un comentario multilínea sobre una categoría. */
@Component({
  selector: 'app-modal-comentario',
  imports: [Modal, Boton, CampoArea],
  templateUrl: './modal-comentario.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComentario {
  readonly titulo = input.required<string>();
  readonly etiqueta = input('Comentario');
  readonly marcador = input('Escribe tu retroalimentación sobre esta categoría…');
  readonly valorInicial = input('');
  readonly textoGuardar = input('Guardar');
  readonly guardar = output<string>();
  readonly cancelar = output<void>();

  protected readonly texto = linkedSignal(() => this.valorInicial());
  protected readonly valido = computed(() => this.texto().trim().length > 0);

  protected confirmar(): void {
    if (this.valido()) this.guardar.emit(this.texto().trim());
  }
}
