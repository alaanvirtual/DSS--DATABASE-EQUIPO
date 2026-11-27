import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalConfirmar } from '../../components/modales/modal-confirmar/modal-confirmar';
import {
  AltaParticipante,
  ModalParticipante
} from '../../components/modales/modal-participante/modal-participante';
import { ModalProyecto } from '../../components/modales/modal-proyecto/modal-proyecto';
import { ModalTopico } from '../../components/modales/modal-topico/modal-topico';
import { Boton } from '../../components/secundarios/boton/boton';
import { CampoSelect } from '../../components/secundarios/campo-select/campo-select';
import { Esqueleto } from '../../components/secundarios/esqueleto/esqueleto';
import { EstadoVacio } from '../../components/secundarios/estado-vacio/estado-vacio';
import { Icono } from '../../components/secundarios/icono/icono';
import { Insignia } from '../../components/secundarios/insignia/insignia';
import {
  EntradaAgenda,
  InicioService,
  ParticipanteDetalle
} from '../../services/inicio.service';
import { formatearFecha, iniciales, rolDeAgenda } from '../../utils/formato';

/** Ícono de Phosphor de cada herramienta, según su ruta. */
const ICONOS: Record<string, string> = {
  chat: 'chat-circle-dots',
  'lluvia-ideas': 'lightbulb',
  categorizador: 'squares-four',
  comentador: 'chat-teardrop-text',
  votacion: 'thumbs-up',
  ponderacion: 'scales',
  matriz: 'table'
};

/** Vista de inicio: proyectos del usuario, participantes y agenda. Ruta: /inicio */
@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink,
    Boton,
    CampoSelect,
    Esqueleto,
    EstadoVacio,
    Icono,
    Insignia,
    ModalConfirmar,
    ModalParticipante,
    ModalProyecto,
    ModalTopico
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Inicio implements OnInit {
  protected readonly servicio = inject(InicioService);

  protected readonly modalProyecto = signal(false);
  protected readonly modalParticipante = signal(false);
  protected readonly modalTopico = signal(false);
  protected readonly confirmarParticipante = signal<ParticipanteDetalle | null>(null);
  protected readonly confirmarTopico = signal<EntradaAgenda | null>(null);

  // Utilidades de presentación para la plantilla.
  protected readonly iniciales = iniciales;
  protected readonly rolDeAgenda = rolDeAgenda;
  protected readonly iconoDe = (ruta: string): string => ICONOS[ruta] ?? 'wrench';

  /** Periodo del proyecto, p. ej. "1 ene 2026 – 30 ene 2026". */
  protected readonly periodo = computed(() => {
    const proyecto = this.servicio.proyectoActual();
    if (!proyecto) return null;

    const inicio = formatearFecha(proyecto.fechainicio);
    const fin = formatearFecha(proyecto.fechafin);

    return inicio && fin ? `${inicio} – ${fin}` : (inicio ?? fin);
  });

  ngOnInit(): void {
    void this.servicio.iniciar();
  }

  protected alProyecto(id: number | null): void {
    if (id !== null) void this.servicio.seleccionarProyecto(id);
  }

  protected async alCrearProyecto(datos: { nombre: string; objetivo: string | null }): Promise<void> {
    if (await this.servicio.crearProyecto(datos.nombre, datos.objetivo)) {
      this.modalProyecto.set(false);
    }
  }

  protected async alAgregarParticipante(datos: AltaParticipante): Promise<void> {
    const listo = datos.idusu
      ? await this.servicio.agregarParticipante(datos.idusu, datos.rol)
      : datos.nuevo
        ? await this.servicio.crearUsuarioYAgregar(datos.nuevo, datos.rol)
        : false;

    if (listo) this.modalParticipante.set(false);
  }

  protected async alAgregarTopico(datos: { topico: string; idtool: number; rol: string }): Promise<void> {
    if (await this.servicio.agregarTopico(datos.topico, datos.idtool, datos.rol)) {
      this.modalTopico.set(false);
    }
  }

  protected async alConfirmarParticipante(): Promise<void> {
    const participante = this.confirmarParticipante();
    if (participante && (await this.servicio.quitarParticipante(participante.idusu))) {
      this.confirmarParticipante.set(null);
    }
  }

  protected async alConfirmarTopico(): Promise<void> {
    const topico = this.confirmarTopico();
    if (topico && (await this.servicio.quitarTopico(topico.idtopico))) {
      this.confirmarTopico.set(null);
    }
  }
}
