import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HERRAMIENTA, TopicoAgenda } from '../models/agenda';
import { Herramienta } from '../models/herramienta';
import { OpcionSelect } from '../models/opcion-select';
import { Participante, Rol } from '../models/participante';
import { Proyecto } from '../models/proyecto';
import { Usuario } from '../models/usuario';
import { siguienteId } from '../utils/siguiente-id';
import { AuthService } from './auth.service';
import { HerramientasService } from './herramientas.service';
import { ProyectosService } from './proyectos.service';
import { ToastService } from './toast.service';
import { UsuariosService } from './usuarios.service';

/** Ruta del frontend para cada herramienta del catálogo. */
const RUTA: Record<number, string> = {
  [HERRAMIENTA.CHAT]: 'chat',
  [HERRAMIENTA.LLUVIA_IDEAS]: 'lluvia-ideas',
  [HERRAMIENTA.CATEGORIZADOR]: 'categorizador',
  [HERRAMIENTA.COMENTADOR]: 'comentador',
  [HERRAMIENTA.VOTACION]: 'votacion',
  [HERRAMIENTA.PONDERACION]: 'ponderacion',
  [HERRAMIENTA.MATRIZ]: 'matriz'
};

export interface ProyectoDelUsuario extends Proyecto {
  rol: Rol | null;
}

export interface EntradaAgenda {
  idtopico: number;
  topico: string;
  herramienta: string;
  ruta: string;
}

export interface ParticipanteDetalle {
  idusu: number;
  rol: Rol;
  nombre: string;
}

/**
 * Estado de la vista de inicio: proyectos del usuario autenticado, participantes
 * y agenda del proyecto seleccionado. El facilitador gestiona todo desde aquí.
 */
@Injectable({ providedIn: 'root' })
export class InicioService {
  private readonly proyectosApi = inject(ProyectosService);
  private readonly herramientasApi = inject(HerramientasService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly proyectos = signal<ProyectoDelUsuario[]>([]);
  readonly herramientas = signal<Herramienta[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly agenda = signal<TopicoAgenda[]>([]);
  readonly participantes = signal<Participante[]>([]);
  readonly idproy = signal<number | null>(null);
  readonly cargando = signal(false);

  readonly opcionesProyectos = computed<OpcionSelect[]>(() =>
    this.proyectos().map((p) => ({ valor: p.id, texto: p.nombre }))
  );

  readonly opcionesHerramientas = computed<OpcionSelect[]>(() =>
    this.herramientas().map((h) => ({ valor: h.id, texto: h.nombre }))
  );

  readonly proyectoActual = computed(
    () => this.proyectos().find((p) => p.id === this.idproy()) ?? null
  );

  readonly agendaActual = computed<EntradaAgenda[]>(() => {
    const nombres = new Map(this.herramientas().map((h) => [h.id, h.nombre]));

    return this.agenda()
      .filter((t) => t.idtool in RUTA)
      .map((t) => ({
        idtopico: t.id,
        topico: t.topico,
        herramienta: nombres.get(t.idtool) ?? `Herramienta ${t.idtool}`,
        ruta: RUTA[t.idtool]
      }));
  });

  readonly participantesDetalle = computed<ParticipanteDetalle[]>(() => {
    const nombres = new Map(this.usuarios().map((u) => [u.id, u.nombre]));

    return this.participantes().map((p) => ({
      idusu: p.idusu,
      rol: p.rol,
      nombre: nombres.get(p.idusu) ?? `Usuario ${p.idusu}`
    }));
  });

  /** Usuarios del sistema que aún no participan en el proyecto actual. */
  readonly usuariosDisponibles = computed<OpcionSelect[]>(() => {
    const dentro = new Set(this.participantes().map((p) => p.idusu));

    return this.usuarios()
      .filter((u) => !dentro.has(u.id))
      .map((u) => ({ valor: u.id, texto: `${u.nombre} (${u.usuario})` }));
  });

  /** Solo el facilitador del proyecto actual gestiona participantes y agenda. */
  readonly puedeEditar = computed(() => this.proyectoActual()?.rol === 'FAC');

  async iniciar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [herramientas, todos, usuarios] = await Promise.all([
        firstValueFrom(this.herramientasApi.listar()),
        firstValueFrom(this.proyectosApi.listar()),
        firstValueFrom(this.usuariosApi.listar())
      ]);
      this.herramientas.set(herramientas);
      this.usuarios.set(usuarios);
      await this.cargarProyectos(todos);

      const actual = this.proyectos().find((p) => p.id === this.idproy()) ?? this.proyectos()[0];
      if (actual) await this.cargarProyecto(actual.id);
    } catch (error) {
      this.reportar(error);
    } finally {
      this.cargando.set(false);
    }
  }

  async seleccionarProyecto(idproy: number): Promise<void> {
    this.cargando.set(true);
    try {
      await this.cargarProyecto(idproy);
    } catch (error) {
      this.reportar(error);
    } finally {
      this.cargando.set(false);
    }
  }

  /** Crea el proyecto en estatus activo y deja a quien lo creó como facilitador. */
  async crearProyecto(nombre: string, objetivo: string | null): Promise<boolean> {
    if (this.idusuario === null) return false;

    return this.mutar(async () => {
      // El servidor deja a quien crea el proyecto como su facilitador, en la misma operación.
      const creado = await firstValueFrom(
        this.proyectosApi.crear({ nombre, objetivo, fechainicio: null, fechafin: null, estatus: 1 })
      );

      await this.cargarProyectos(await firstValueFrom(this.proyectosApi.listar()));
      await this.cargarProyecto(creado.id);
      this.toast.exito('Proyecto creado. Eres el facilitador.');
    });
  }

  async agregarParticipante(idusu: number, rol: Rol): Promise<boolean> {
    const idproy = this.idproy();
    if (idproy === null) return false;

    return this.mutar(async () => {
      await firstValueFrom(this.proyectosApi.agregarParticipante(idproy, { idusu, rol }));
      this.participantes.set(await firstValueFrom(this.proyectosApi.listarParticipantes(idproy)));
      this.toast.exito('Participante agregado');
    });
  }

  /** Registra un usuario nuevo y lo agrega de una vez al proyecto actual. */
  async crearUsuarioYAgregar(
    nuevo: { nombre: string; correo: string; usuario: string; passw: string },
    rol: Rol
  ): Promise<boolean> {
    const idproy = this.idproy();
    if (idproy === null) return false;

    return this.mutar(async () => {
      const creado = await firstValueFrom(this.usuariosApi.crear(nuevo));
      await firstValueFrom(this.proyectosApi.agregarParticipante(idproy, { idusu: creado.id, rol }));
      this.usuarios.set(await firstValueFrom(this.usuariosApi.listar()));
      this.participantes.set(await firstValueFrom(this.proyectosApi.listarParticipantes(idproy)));
      this.toast.exito(`Usuario ${creado.nombre} creado y agregado`);
    });
  }

  async quitarParticipante(idusu: number): Promise<boolean> {
    const idproy = this.idproy();
    if (idproy === null) return false;

    return this.mutar(async () => {
      await firstValueFrom(this.proyectosApi.quitarParticipante(idproy, idusu));
      this.participantes.set(await firstValueFrom(this.proyectosApi.listarParticipantes(idproy)));
      this.toast.exito('Participante eliminado');
    });
  }

  async agregarTopico(topico: string, idtool: number, rol: string): Promise<boolean> {
    const idproy = this.idproy();
    if (idproy === null) return false;

    return this.mutar(async () => {
      await firstValueFrom(
        this.proyectosApi.agregarTopico(idproy, {
          id: siguienteId(this.agenda()),
          topico,
          rol,
          idtool
        })
      );
      this.agenda.set(await firstValueFrom(this.proyectosApi.listarAgenda(idproy)));
      this.toast.exito('Actividad agregada a la agenda');
    });
  }

  /** Elimina el tópico y, en cascada, su chat, ideas y valoraciones. */
  async quitarTopico(idtopico: number): Promise<boolean> {
    const idproy = this.idproy();
    if (idproy === null) return false;

    return this.mutar(async () => {
      await firstValueFrom(this.proyectosApi.quitarTopico(idproy, idtopico));
      this.agenda.set(await firstValueFrom(this.proyectosApi.listarAgenda(idproy)));
      this.toast.exito('Actividad eliminada');
    });
  }

  private async cargarProyectos(todos: Proyecto[]): Promise<void> {
    const conRol = await Promise.all(
      todos.map(async (proyecto) => ({ ...proyecto, rol: await this.rolEn(proyecto.id) }))
    );
    this.proyectos.set(conRol.filter((p) => p.rol !== null));
  }

  private async cargarProyecto(idproy: number): Promise<void> {
    this.idproy.set(idproy);

    const [participantes, agenda] = await Promise.all([
      firstValueFrom(this.proyectosApi.listarParticipantes(idproy)),
      firstValueFrom(this.proyectosApi.listarAgenda(idproy))
    ]);
    this.participantes.set(participantes);
    this.agenda.set(agenda);
  }

  private async rolEn(idproy: number): Promise<Rol | null> {
    const participantes = await firstValueFrom(this.proyectosApi.listarParticipantes(idproy));
    const propio = participantes.find((p) => p.idusu === this.idusuario);
    return propio?.rol ?? null;
  }

  private get idusuario(): number | null {
    return this.auth.usuario()?.id ?? null;
  }

  /** Ejecuta la mutación; devuelve true si terminó bien para cerrar el modal. */
  private async mutar(accion: () => Promise<void>): Promise<boolean> {
    this.cargando.set(true);
    try {
      await accion();
      return true;
    } catch (error) {
      this.reportar(error);
      return false;
    } finally {
      this.cargando.set(false);
    }
  }

  private reportar(error: unknown): void {
    this.toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
  }
}
