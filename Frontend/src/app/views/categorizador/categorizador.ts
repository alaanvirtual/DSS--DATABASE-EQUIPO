import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { BarraContexto } from '../../components/principales/barra-contexto/barra-contexto';
import { TableroCategorizador } from '../../components/principales/tablero-categorizador/tablero-categorizador';
import { CategorizadorService } from '../../services/categorizador.service';

/** Vista de la herramienta 3 del SADMG: Categorizador. Ruta: /categorizador */
@Component({
  selector: 'app-categorizador',
  imports: [BarraContexto, TableroCategorizador],
  templateUrl: './categorizador.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categorizador implements OnInit {
  private readonly servicio = inject(CategorizadorService);

  ngOnInit(): void {
    void this.servicio.iniciar();
  }
}
