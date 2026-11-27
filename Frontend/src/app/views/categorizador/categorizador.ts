import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarraContexto } from '../../components/principales/barra-contexto/barra-contexto';
import { TableroCategorizador } from '../../components/principales/tablero-categorizador/tablero-categorizador';
import { Boton } from '../../components/secundarios/boton/boton';
import { CategorizadorService } from '../../services/categorizador.service';

/** Vista de la herramienta 3 del SADMG: Categorizador. Ruta: /categorizador */
@Component({
  selector: 'app-categorizador',
  imports: [RouterLink, BarraContexto, TableroCategorizador, Boton],
  templateUrl: './categorizador.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categorizador implements OnInit {
  private readonly servicio = inject(CategorizadorService);

  ngOnInit(): void {
    void this.servicio.iniciar();
  }
}
