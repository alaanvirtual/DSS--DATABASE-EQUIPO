import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Boton } from '../../secundarios/boton/boton';
import { Modal } from '../modal/modal';

/** Diálogo de confirmación para acciones destructivas o irreversibles. */
@Component({
  selector: 'app-modal-confirmar',
  imports: [Modal, Boton],
  templateUrl: './modal-confirmar.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConfirmar {
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly textoConfirmar = input('Confirmar');
  readonly peligro = input(false);
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
