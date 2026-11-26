import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output
} from '@angular/core';
import { Boton } from '../../secundarios/boton/boton';
import { CampoTexto } from '../../secundarios/campo-texto/campo-texto';
import { Modal } from '../modal/modal';

/** Diálogo para capturar o editar un nombre de una sola línea (p. ej. una categoría). */
@Component({
  selector: 'app-modal-nombre',
  imports: [Modal, Boton, CampoTexto],
  templateUrl: './modal-nombre.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalNombre {
  readonly titulo = input.required<string>();
  readonly etiqueta = input('Nombre');
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
