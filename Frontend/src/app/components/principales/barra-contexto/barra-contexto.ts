import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OpcionSelect } from '../../../models/opcion-select';
import { CategorizadorService } from '../../../services/categorizador.service';
import { CampoSelect } from '../../secundarios/campo-select/campo-select';
import { Esqueleto } from '../../secundarios/esqueleto/esqueleto';
import { Insignia } from '../../secundarios/insignia/insignia';

/**
 * Selectores de contexto: proyecto y tópico de categorización, más el rol del usuario
 * autenticado en ese proyecto.
 */
@Component({
  selector: 'app-barra-contexto',
  imports: [CampoSelect, Esqueleto, Insignia],
  templateUrl: './barra-contexto.html',
  styleUrl: './barra-contexto.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarraContexto {
  protected readonly servicio = inject(CategorizadorService);

  protected readonly camposEsqueleto = [1, 2];

  /** Primera carga: todavía no hay proyectos que mostrar en los selectores. */
  protected readonly cargandoContexto = computed(
    () => this.servicio.cargando() && this.servicio.proyectos().length === 0
  );

  protected readonly proyectos = computed<OpcionSelect[]>(() =>
    this.servicio.proyectos().map((p) => ({ valor: p.id, texto: p.nombre }))
  );

  protected readonly topicos = computed<OpcionSelect[]>(() =>
    this.servicio.topicosCategorizador().map((t) => ({ valor: t.id, texto: t.topico }))
  );

  protected alProyecto(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarProyecto(id);
  }

  protected alTopico(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarTopico(id);
  }
}
