import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TarjetaCategoriaComentarios as DatosTarjeta } from '../../../models/comentario';
import { claveIdea } from '../../../utils/clave-idea';
import { Boton } from '../../secundarios/boton/boton';
import { Icono } from '../../secundarios/icono/icono';
import { Insignia } from '../../secundarios/insignia/insignia';
import { TarjetaIdea } from '../tarjeta-idea/tarjeta-idea';

/**
 * Tarjeta de una categoría en el Comentador: muestra sus ideas agrupadas,
 * la retroalimentación de los participantes y las acciones sobre el comentario propio.
 */
@Component({
  selector: 'app-tarjeta-comentarios',
  imports: [Boton, Icono, Insignia, TarjetaIdea],
  templateUrl: './tarjeta-comentarios.html',
  styleUrl: './tarjeta-comentarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TarjetaComentarios {
  readonly tarjeta = input.required<DatosTarjeta>();
  readonly editable = input(false);
  readonly deshabilitado = input(false);

  readonly comentar = output<void>();
  readonly eliminarPropio = output<void>();

  protected readonly claveIdea = claveIdea;
}
