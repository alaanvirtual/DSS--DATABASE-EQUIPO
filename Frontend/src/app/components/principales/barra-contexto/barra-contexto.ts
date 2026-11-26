import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OpcionSelect } from '../../../models/opcion-select';
import { CategorizadorService } from '../../../services/categorizador.service';
import { CampoSelect } from '../../secundarios/campo-select/campo-select';
import { Insignia } from '../../secundarios/insignia/insignia';

/** Selectores de contexto: proyecto, usuario que actúa y tópico de categorización. */
@Component({
  selector: 'app-barra-contexto',
  imports: [CampoSelect, Insignia],
  templateUrl: './barra-contexto.html',
  styleUrl: './barra-contexto.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarraContexto {
  protected readonly servicio = inject(CategorizadorService);

  protected readonly proyectos = computed<OpcionSelect[]>(() =>
    this.servicio.proyectos().map((p) => ({ valor: p.id, texto: p.nombre }))
  );

  protected readonly usuarios = computed<OpcionSelect[]>(() => {
    const nombres = new Map(this.servicio.usuarios().map((u) => [u.id, u.nombre]));
    return this.servicio.participantes().map((p) => ({
      valor: p.idusu,
      texto: `${nombres.get(p.idusu) ?? `Usuario ${p.idusu}`} (${p.rol})`
    }));
  });

  protected readonly topicos = computed<OpcionSelect[]>(() =>
    this.servicio.topicosCategorizador().map((t) => ({ valor: t.id, texto: t.topico }))
  );

  protected alProyecto(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarProyecto(id);
  }

  protected alUsuario(id: number | null): void {
    if (id !== null) this.servicio.seleccionarUsuario(id);
  }

  protected alTopico(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarTopico(id);
  }
}
