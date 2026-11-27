import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';

/** Vista provisional de la herramienta 2 del SADMG: Lluvia de ideas. Ruta: /lluvia-ideas */
@Component({
  selector: 'app-lluvia-ideas',
  imports: [RouterLink, Boton, EstadoVacio],
  templateUrl: './lluvia-ideas.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LluviaIdeas {}
