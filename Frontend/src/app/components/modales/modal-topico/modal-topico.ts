import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output
} from '@angular/core';
import { OpcionSelect } from '../../../models/opcion-select';
import { Boton } from '../../secundarios/boton/boton';
import { CampoSelect } from '../../secundarios/campo-select/campo-select';
import { CampoTexto } from '../../secundarios/campo-texto/campo-texto';
import { Modal } from '../modal/modal';

/** El campo rol de la agenda admite varios roles separados por coma: 'FAC, DEC'. */
const ROLES_AGENDA: OpcionSelect[] = [
  { valor: 1, texto: 'Solo facilitador' },
  { valor: 2, texto: 'Solo decisores' },
  { valor: 3, texto: 'Facilitador y decisores' }
];

/** Diálogo para agregar una actividad (tópico) a la agenda con su herramienta y roles. */
@Component({
  selector: 'app-modal-topico',
  imports: [Modal, Boton, CampoSelect, CampoTexto],
  templateUrl: './modal-topico.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalTopico {
  readonly titulo = input.required<string>();
  readonly herramientas = input.required<OpcionSelect[]>();
  readonly guardar = output<{ topico: string; idtool: number; rol: string }>();
  readonly cancelar = output<void>();

  protected readonly rolesAgenda = ROLES_AGENDA;
  protected readonly topico = linkedSignal(() => '');
  protected readonly idtool = linkedSignal<number | null>(() => this.herramientas()[0]?.valor ?? null);
  protected readonly rol = linkedSignal<number>(() => 3);
  protected readonly valido = computed(() => this.topico().trim().length > 0 && this.idtool() !== null);

  protected confirmar(): void {
    const idtool = this.idtool();
    if (!this.valido() || idtool === null) return;

    const rol = this.rol() === 1 ? 'FAC' : this.rol() === 2 ? 'DEC' : 'FAC, DEC';
    this.guardar.emit({ topico: this.topico().trim(), idtool, rol });
  }
}
