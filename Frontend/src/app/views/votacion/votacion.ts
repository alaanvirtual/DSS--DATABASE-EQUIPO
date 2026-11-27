import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';

/** Vista provisional de la herramienta 5 del SADMG: Votación. Ruta: /votacion */
@Component({
  selector: 'app-votacion',
  imports: [RouterLink, Boton, EstadoVacio],
  templateUrl: './votacion.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Votacion {}
