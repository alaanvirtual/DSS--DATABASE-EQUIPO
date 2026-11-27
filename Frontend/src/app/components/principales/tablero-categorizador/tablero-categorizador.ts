import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Categoria } from '../../../models/categoria';
import { ArrastreIdea } from '../../../models/idea';
import { OpcionSelect } from '../../../models/opcion-select';
import { CategorizadorService } from '../../../services/categorizador.service';
import { leerArrastre } from '../../../utils/arrastre-idea';
import { claveIdea } from '../../../utils/clave-idea';
import { ColumnaCategoria } from '../../compuestos/columna-categoria/columna-categoria';
import { EsqueletoTablero } from '../../compuestos/esqueleto-tablero/esqueleto-tablero';
import { TarjetaIdea } from '../../compuestos/tarjeta-idea/tarjeta-idea';
import { ModalConfirmar } from '../../modales/modal-confirmar/modal-confirmar';
import { ModalNombre } from '../../modales/modal-nombre/modal-nombre';
import { Boton } from '../../secundarios/boton/boton';
import { EstadoError } from '../../secundarios/estado-error/estado-error';
import { EstadoVacio } from '../../secundarios/estado-vacio/estado-vacio';
import { Icono } from '../../secundarios/icono/icono';
import { Insignia } from '../../secundarios/insignia/insignia';

/**
 * Tablero del Categorizador: a la izquierda las ideas sin categorizar y a la
 * derecha las categorías. El facilitador arrastra ideas entre ellas.
 */
@Component({
  selector: 'app-tablero-categorizador',
  imports: [
    Boton,
    ColumnaCategoria,
    EsqueletoTablero,
    EstadoError,
    EstadoVacio,
    Icono,
    Insignia,
    ModalConfirmar,
    ModalNombre,
    TarjetaIdea
  ],
  templateUrl: './tablero-categorizador.html',
  styleUrl: './tablero-categorizador.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableroCategorizador {
  protected readonly servicio = inject(CategorizadorService);
  protected readonly claveIdea = claveIdea;

  protected readonly creando = signal(false);
  protected readonly renombrando = signal<Categoria | null>(null);
  protected readonly eliminando = signal<Categoria | null>(null);
  protected readonly encimaPendientes = signal(false);

  protected readonly destinos = computed<OpcionSelect[]>(() =>
    this.servicio.categoriasVisibles().map((c) => ({ valor: c.id, texto: c.nombre }))
  );

  // ── Categorías ────────────────────────────────────────────────────────

  protected async crear(nombre: string): Promise<void> {
    this.creando.set(false);
    await this.servicio.crearCategoria(nombre);
  }

  protected async renombrar(nombre: string): Promise<void> {
    const categoria = this.renombrando();
    this.renombrando.set(null);
    if (categoria && categoria.nombre !== nombre) {
      await this.servicio.renombrarCategoria(categoria, nombre);
    }
  }

  protected async eliminar(): Promise<void> {
    const categoria = this.eliminando();
    this.eliminando.set(null);
    if (categoria) await this.servicio.eliminarCategoria(categoria);
  }

  // ── Ideas ─────────────────────────────────────────────────────────────

  protected async asignar(arrastre: ArrastreIdea, destino: number): Promise<void> {
    await this.servicio.asignarIdea(arrastre, destino);
  }

  protected alArrastrarSobrePendientes(evento: DragEvent): void {
    if (!this.servicio.puedeEditar()) return;
    evento.preventDefault();
    this.encimaPendientes.set(true);
  }

  protected alSalirDePendientes(evento: DragEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (!destino || !(evento.currentTarget as Node).contains(destino)) {
      this.encimaPendientes.set(false);
    }
  }

  protected async alSoltarEnPendientes(evento: DragEvent): Promise<void> {
    evento.preventDefault();
    this.encimaPendientes.set(false);

    const arrastre = leerArrastre(evento.dataTransfer);
    if (arrastre && this.servicio.puedeEditar()) {
      await this.servicio.desasignarArrastre(arrastre);
    }
  }
}
