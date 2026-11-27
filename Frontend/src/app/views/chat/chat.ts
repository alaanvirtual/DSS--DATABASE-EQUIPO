import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';

/** Vista provisional de la herramienta 1 del SADMG: Chat. Ruta: /chat */
@Component({
  selector: 'app-chat',
  imports: [RouterLink, Boton, EstadoVacio],
  templateUrl: './chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Chat {}
