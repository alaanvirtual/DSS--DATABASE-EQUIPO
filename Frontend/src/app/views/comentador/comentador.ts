import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';

/** Vista provisional de la herramienta 4 del SADMG: Comentador. Ruta: /comentador */
@Component({
  selector: 'app-comentador',
  imports: [RouterLink, Boton, EstadoVacio],
  templateUrl: './comentador.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Comentador {}
