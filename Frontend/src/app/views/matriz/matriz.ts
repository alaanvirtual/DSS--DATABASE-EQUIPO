import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';

/** Vista provisional de la herramienta 7 del SADMG: Matriz valuada. Ruta: /matriz */
@Component({
  selector: 'app-matriz',
  imports: [RouterLink, Boton, EstadoVacio],
  templateUrl: './matriz.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Matriz {}
