import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OpcionSelect } from '../../../models/opcion-select';
import { ComentadorService } from '../../../services/comentador.service';
import { CampoSelect } from '../../secundarios/campo-select/campo-select';
import { Insignia } from '../../secundarios/insignia/insignia';

/** Selectores de contexto del Comentador: proyecto, tópico y rol del usuario autenticado. */
@Component({
  selector: 'app-barra-contexto-comentador',
  imports: [CampoSelect, Insignia],
  templateUrl: './barra-contexto-comentador.html',
  styleUrl: './barra-contexto-comentador.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarraContextoComentador {
  protected readonly servicio = inject(ComentadorService);

  protected readonly proyectos = computed<OpcionSelect[]>(() =>
    this.servicio.proyectos().map((p) => ({ valor: p.id, texto: p.nombre }))
  );

  protected readonly topicos = computed<OpcionSelect[]>(() =>
    this.servicio.topicosComentador().map((t) => ({ valor: t.id, texto: t.topico }))
  );

  protected alProyecto(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarProyecto(id);
  }

  protected alTopico(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarTopico(id);
  }
}
