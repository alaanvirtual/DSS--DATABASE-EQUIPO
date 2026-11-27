import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TarjetaCategoriaComentarios } from '../../../models/comentario';
import { ComentadorService } from '../../../services/comentador.service';
import { EsqueletoTablero } from '../../compuestos/esqueleto-tablero/esqueleto-tablero';
import { TarjetaComentarios } from '../../compuestos/tarjeta-comentarios/tarjeta-comentarios';
import { ModalComentario } from '../../modales/modal-comentario/modal-comentario';
import { ModalConfirmar } from '../../modales/modal-confirmar/modal-confirmar';
import { EstadoError } from '../../secundarios/estado-error/estado-error';
import { EstadoVacio } from '../../secundarios/estado-vacio/estado-vacio';
import { Icono } from '../../secundarios/icono/icono';
import { Insignia } from '../../secundarios/insignia/insignia';

/**
 * Tablero del Comentador: presenta las categorías consolidadas junto con sus ideas
 * y la retroalimentación de los participantes. Los decisores publican, editan o
 * eliminan su propio comentario en cada categoría.
 */
@Component({
  selector: 'app-tablero-comentador',
  imports: [
    EsqueletoTablero,
    EstadoError,
    EstadoVacio,
    Icono,
    Insignia,
    ModalComentario,
    ModalConfirmar,
    TarjetaComentarios
  ],
  templateUrl: './tablero-comentador.html',
  styleUrl: './tablero-comentador.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableroComentador {
  protected readonly servicio = inject(ComentadorService);

  protected readonly comentando = signal<TarjetaCategoriaComentarios | null>(null);
  protected readonly eliminando = signal<TarjetaCategoriaComentarios | null>(null);

  protected async guardar(texto: string): Promise<void> {
    const tarjeta = this.comentando();
    this.comentando.set(null);

    if (!tarjeta) return;
    if (tarjeta.comentarioPropio?.comentario === texto) return;

    await this.servicio.guardarComentario(tarjeta.categoria, texto);
  }

  protected async eliminar(): Promise<void> {
    const tarjeta = this.eliminando();
    this.eliminando.set(null);

    if (tarjeta) await this.servicio.eliminarComentario(tarjeta.categoria);
  }
}
