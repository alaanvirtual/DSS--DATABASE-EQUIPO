import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarraContextoComentador } from '../../components/principales/barra-contexto-comentador/barra-contexto-comentador';
import { TableroComentador } from '../../components/principales/tablero-comentador/tablero-comentador';
import { Boton } from '../../components/secundarios/boton/boton';
import { ComentadorService } from '../../services/comentador.service';

/** Vista de la herramienta 4 del SADMG: Comentador. Ruta: /comentador */
@Component({
  selector: 'app-comentador',
  imports: [RouterLink, BarraContextoComentador, TableroComentador, Boton],
  templateUrl: './comentador.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Comentador implements OnInit {
  private readonly servicio = inject(ComentadorService);

  ngOnInit(): void {
    void this.servicio.iniciar();
  }
}
