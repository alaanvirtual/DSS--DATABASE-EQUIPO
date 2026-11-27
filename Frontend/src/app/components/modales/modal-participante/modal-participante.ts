import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal
} from '@angular/core';
import { OpcionSelect } from '../../../models/opcion-select';
import { Rol } from '../../../models/participante';
import { Boton } from '../../secundarios/boton/boton';
import { CampoSelect } from '../../secundarios/campo-select/campo-select';
import { CampoTexto } from '../../secundarios/campo-texto/campo-texto';
import { EstadoVacio } from '../../secundarios/estado-vacio/estado-vacio';
import { Modal } from '../modal/modal';

const ROLES: OpcionSelect[] = [
  { valor: 1, texto: 'Facilitador (FAC)' },
  { valor: 2, texto: 'Decisor (DEC)' }
];

export interface AltaParticipante {
  rol: Rol;
  /** Usuario existente elegido de la lista. */
  idusu?: number;
  /** Usuario nuevo que se registra y agrega en un solo paso. */
  nuevo?: { nombre: string; correo: string; usuario: string; passw: string };
}

/** Diálogo para incorporar alguien al proyecto: elegir usuario existente o registrar uno nuevo. */
@Component({
  selector: 'app-modal-participante',
  imports: [Modal, Boton, CampoSelect, CampoTexto, EstadoVacio],
  templateUrl: './modal-participante.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalParticipante {
  readonly titulo = input.required<string>();
  readonly usuarios = input.required<OpcionSelect[]>();
  readonly guardar = output<AltaParticipante>();
  readonly cancelar = output<void>();

  protected readonly roles = ROLES;
  protected readonly modo = signal<'elegir' | 'crear'>('elegir');

  protected readonly idusu = linkedSignal<number | null>(() => null);
  protected readonly rol = linkedSignal<number>(() => 2);

  protected readonly nombre = linkedSignal(() => '');
  protected readonly correo = linkedSignal(() => '');
  protected readonly alias = linkedSignal(() => '');
  protected readonly passw = linkedSignal(() => '');

  protected readonly hayUsuarios = computed(() => this.usuarios().length > 0);
  protected readonly validoElegir = computed(() => this.idusu() !== null);

  protected readonly validoCrear = computed(
    () =>
      this.nombre().trim().length > 0 &&
      this.correo().trim().length > 3 &&
      this.correo().includes('@') &&
      this.alias().trim().length > 0 &&
      this.passw().trim().length > 0
  );

  protected elegir(valor: number | null): void {
    if (valor !== null) this.idusu.set(valor);
  }

  protected confirmar(): void {
    const rol = this.rol() === 1 ? 'FAC' : 'DEC';

    if (this.modo() === 'elegir') {
      const idusu = this.idusu();
      if (idusu !== null) this.guardar.emit({ rol, idusu });
      return;
    }

    if (this.validoCrear()) {
      this.guardar.emit({
        rol,
        nuevo: {
          nombre: this.nombre().trim(),
          correo: this.correo().trim(),
          usuario: this.alias().trim(),
          passw: this.passw().trim()
        }
      });
    }
  }
}
