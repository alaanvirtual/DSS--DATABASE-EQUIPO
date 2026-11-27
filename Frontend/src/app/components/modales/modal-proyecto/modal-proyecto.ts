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

/** Diálogo para crear un proyecto: nombre y objetivo. Quien lo crea queda como facilitador. */
@Component({
  selector: 'app-modal-proyecto',
  imports: [Modal, Boton, CampoTexto],
  templateUrl: './modal-proyecto.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalProyecto {
  readonly titulo = input.required<string>();
  readonly guardar = output<{ nombre: string; objetivo: string | null }>();
  readonly cancelar = output<void>();

  protected readonly nombre = linkedSignal(() => '');
  protected readonly objetivo = linkedSignal(() => '');
  protected readonly valido = computed(() => this.nombre().trim().length > 0);

  protected confirmar(): void {
    if (!this.valido()) return;
    const objetivo = this.objetivo().trim();
    this.guardar.emit({ nombre: this.nombre().trim(), objetivo: objetivo || null });
  }
}
