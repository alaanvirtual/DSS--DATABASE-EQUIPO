import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';

/** Vista provisional de la herramienta 6 del SADMG: Ponderación de criterios. Ruta: /ponderacion */
@Component({
  selector: 'app-ponderacion',
  imports: [RouterLink, Boton, EstadoVacio],
  templateUrl: './ponderacion.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ponderacion {}
