import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HERRAMIENTA, TopicoAgenda } from '../models/agenda';
import { Categoria, ColumnaCategoria } from '../models/categoria';
import { CategoriaDetalle } from '../models/categoria-detalle';
import { ArrastreIdea, Idea, IdeaConAutor } from '../models/idea';
import { Participante } from '../models/participante';
import { Proyecto } from '../models/proyecto';
import { Usuario } from '../models/usuario';
import { claveDeDetalle, claveIdea } from '../utils/clave-idea';
import { DescripcionError, describirError } from '../utils/describir-error';
import { topicoOrigen } from '../utils/topico-origen';
import { AuthService } from './auth.service';
import { CategoriasService } from './categorias.service';
import { ProyectosService } from './proyectos.service';
import { SesionService } from './sesion.service';
import { ToastService } from './toast.service';
import { UsuariosService } from './usuarios.service';

function conAutor(idea: Idea, nombres: Map<number, string>): IdeaConAutor {
  return { ...idea, autor: nombres.get(idea.idusuario) ?? `Usuario ${idea.idusuario}` };
}

/**
 * Estado y acciones de la herramienta Categorizador (herramienta 3 del SADMG).
 *
 * El facilitador toma las ideas de la lluvia de ideas del tópico anterior y las
 * agrupa en categorías. Los componentes solo leen señales y llaman a estas acciones.
 */
@Injectable({ providedIn: 'root' })
export class CategorizadorService {
  private readonly proyectosApi = inject(ProyectosService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly categoriasApi = inject(CategoriasService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly sesion = inject(SesionService);

  // ── Contexto ──────────────────────────────────────────────────────────
  readonly proyectos = signal<Proyecto[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly participantes = signal<Participante[]>([]);
  readonly agenda = signal<TopicoAgenda[]>([]);
  readonly idtopico = signal<number | null>(null);
  readonly idproy = this.sesion.idproy.asReadonly();
  /** Usuario autenticado: es quien actúa (ya no se elige otro). */
  readonly idusuario = computed(() => this.auth.usuario()?.id ?? null);

  // ── Datos del tablero ─────────────────────────────────────────────────
  readonly ideas = signal<Idea[]>([]);
  /** Categorías del tópico categorizador seleccionado. */
  readonly categorias = signal<Categoria[]>([]);
  readonly detalles = signal<CategoriaDetalle[]>([]);

  /**
   * Si el usuario autenticado puede editar el tópico. Lo decide el servidor (es facilitador
   * del proyecto y la agenda lo permite), así la vista nunca contradice lo que la API acepta.
   */
  private readonly puedeEditarServidor = signal(false);
  readonly puedeEditar = this.puedeEditarServidor.asReadonly();

  // ── Estado de carga ───────────────────────────────────────────────────
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  /** Fallo de la última carga (no de una edición): la pantalla muestra el error con "Reintentar". */
  readonly errorCarga = signal<DescripcionError | null>(null);

  // ── Derivados ─────────────────────────────────────────────────────────
  readonly topicosCategorizador = computed(() =>
    this.agenda().filter((t) => t.idtool === HERRAMIENTA.CATEGORIZADOR)
  );

  readonly topicoActual = computed(() =>
    this.topicosCategorizador().find((t) => t.id === this.idtopico())
  );

  /** Tópico de lluvia de ideas cuyas ideas se están categorizando. */
  readonly topicoOrigenActual = computed(() => topicoOrigen(this.agenda(), this.topicoActual()));

  readonly rolActual = computed(
    () => this.participantes().find((p) => p.idusu === this.idusuario())?.rol ?? null
  );

  private readonly nombresUsuarios = computed(
    () => new Map(this.usuarios().map((u) => [u.id, u.nombre]))
  );

  private readonly ideasPorClave = computed(
    () => new Map(this.ideas().map((i) => [claveIdea(i), i]))
  );

  /** Cada categoría pertenece a un tópico, así que ya llegan filtradas por el tópico actual. */
  readonly categoriasVisibles = computed(() => this.categorias());

  readonly columnas = computed<ColumnaCategoria[]>(() => {
    const ideas = this.ideasPorClave();
    const nombres = this.nombresUsuarios();
    const detalles = this.detalles();

    return this.categoriasVisibles().map((categoria) => ({
      categoria,
      ideas: detalles
        .filter((d) => d.idcat === categoria.id)
        .map((d) => ideas.get(claveDeDetalle(d)))
        .filter((i): i is Idea => !!i)
        .map((i) => conAutor(i, nombres))
    }));
  });

  readonly ideasSinCategorizar = computed<IdeaConAutor[]>(() => {
    const usadas = new Set(this.detalles().map(claveDeDetalle));
    const nombres = this.nombresUsuarios();

    return this.ideas()
      .filter((i) => !usadas.has(claveIdea(i)))
      .map((i) => conAutor(i, nombres));
  });

  // ── Carga ─────────────────────────────────────────────────────────────

  async iniciar(): Promise<void> {
    await this.conCarga(() => this.cargarInicial());
  }

  /** Reintenta la carga que falló: la inicial si aún no hay contexto, o la del proyecto actual. */
  async reintentar(): Promise<void> {
    const idproy = this.idproy();

    await this.conCarga(() =>
      idproy === null || this.proyectos().length === 0
        ? this.cargarInicial()
        : this.cargarProyecto(idproy)
    );
  }

  async seleccionarProyecto(idproy: number): Promise<void> {
    await this.conCarga(() => this.cargarProyecto(idproy));
  }

  async seleccionarTopico(idtopico: number): Promise<void> {
    this.idtopico.set(idtopico);
    await this.conCarga(() => this.cargarTablero());
  }

  // ── Acciones sobre categorías ─────────────────────────────────────────

  async crearCategoria(nombre: string): Promise<void> {
    const idproy = this.idproy();
    const idtopico = this.idtopico();
    if (idproy === null || idtopico === null) return;

    await this.mutar(async () => {
      // El servidor asigna el id de la categoría.
      await firstValueFrom(this.categoriasApi.crear(idproy, idtopico, nombre));
      await this.cargarTablero();
    }, 'Categoría creada');
  }

  async renombrarCategoria(categoria: Categoria, nombre: string): Promise<void> {
    await this.mutar(async () => {
      await firstValueFrom(this.categoriasApi.renombrar(categoria.idproy, categoria.id, nombre));
      this.categorias.update((lista) =>
        lista.map((c) => (c.id === categoria.id ? { ...c, nombre } : c))
      );
    }, 'Categoría renombrada');
  }

  /** Elimina la categoría y, en cascada, sus asignaciones, comentarios y votos. */
  async eliminarCategoria(categoria: Categoria): Promise<void> {
    await this.mutar(async () => {
      await firstValueFrom(this.categoriasApi.eliminar(categoria.idproy, categoria.id));
      await this.cargarTablero();
    }, 'Categoría eliminada');
  }

  // ── Acciones sobre ideas ──────────────────────────────────────────────

  /** Asigna una idea a una categoría; si venía de otra, la mueve. */
  async asignarIdea(arrastre: ArrastreIdea, destino: number): Promise<void> {
    const idproy = this.idproy();
    const idea = this.ideasPorClave().get(arrastre.clave);
    if (idproy === null || !idea || arrastre.origen === destino) return;

    const yaEstaba = this.detalles().some(
      (d) => d.idcat === destino && claveDeDetalle(d) === arrastre.clave
    );

    await this.mutar(async () => {
      // Actualización optimista: la interfaz responde sin esperar a la API.
      this.detalles.update((lista) => {
        const sinOrigen = lista.filter(
          (d) => !(d.idcat === arrastre.origen && claveDeDetalle(d) === arrastre.clave)
        );
        return yaEstaba
          ? sinOrigen
          : [
              ...sinOrigen,
              {
                idproy,
                idcat: destino,
                idtopico: idea.idtopico,
                idusuario: idea.idusuario,
                ididea: idea.id
              }
            ];
      });

      // Una sola operación atómica en el servidor: quita la asignación anterior y crea la nueva.
      await firstValueFrom(this.categoriasApi.moverIdea(idproy, idea, destino));
    });
  }

  /** Quita una idea de una categoría y vuelve a "sin categorizar". */
  async quitarIdea(idea: Idea, idcat: number): Promise<void> {
    const idproy = this.idproy();
    if (idproy === null) return;

    const clave = claveIdea(idea);

    await this.mutar(async () => {
      this.detalles.update((lista) =>
        lista.filter((d) => !(d.idcat === idcat && claveDeDetalle(d) === clave))
      );
      await firstValueFrom(this.categoriasApi.moverIdea(idproy, idea, null));
    });
  }

  /** Devuelve a "sin categorizar" una idea arrastrada desde una categoría. */
  async desasignarArrastre(arrastre: ArrastreIdea): Promise<void> {
    if (arrastre.origen === null) return;

    const idea = this.ideasPorClave().get(arrastre.clave);
    if (idea) await this.quitarIdea(idea, arrastre.origen);
  }

  // ── Internos ──────────────────────────────────────────────────────────

  private async cargarInicial(): Promise<void> {
    const [proyectos, usuarios] = await Promise.all([
      firstValueFrom(this.proyectosApi.listar()),
      firstValueFrom(this.usuariosApi.listar())
    ]);
    this.proyectos.set(proyectos);
    this.usuarios.set(usuarios);

    const inicial = proyectos.find((p) => p.id === this.idproy()) ?? proyectos[0];
    if (inicial) await this.cargarProyecto(inicial.id);
  }

  private async cargarProyecto(idproy: number): Promise<void> {
    this.sesion.idproy.set(idproy);

    const [participantes, agenda] = await Promise.all([
      firstValueFrom(this.proyectosApi.listarParticipantes(idproy)),
      firstValueFrom(this.proyectosApi.listarAgenda(idproy))
    ]);
    this.participantes.set(participantes);
    this.agenda.set(agenda);

    const topicos = this.topicosCategorizador();
    this.idtopico.set((topicos.find((t) => t.id === this.idtopico()) ?? topicos[0])?.id ?? null);

    await this.cargarTablero();
  }

  private async cargarTablero(): Promise<void> {
    const idproy = this.idproy();
    const idtopico = this.idtopico();

    if (idproy === null || idtopico === null) {
      this.ideas.set([]);
      this.categorias.set([]);
      this.detalles.set([]);
      this.puedeEditarServidor.set(false);
      return;
    }

    // Una sola petición trae las ideas, las categorías y las asignaciones del tópico.
    const datos = await firstValueFrom(this.categoriasApi.cargarTablero(idproy, idtopico));

    this.ideas.set(datos.ideas);
    this.categorias.set(datos.categorias);
    this.detalles.set(datos.detalles);
    this.puedeEditarServidor.set(datos.puedeEditar);
  }

  private async conCarga(accion: () => Promise<void>): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      await accion();
    } catch (error) {
      this.errorCarga.set(describirError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private async mutar(accion: () => Promise<void>, mensajeExito?: string): Promise<void> {
    this.guardando.set(true);
    try {
      await accion();
      if (mensajeExito) this.toast.exito(mensajeExito);
    } catch (error) {
      this.reportar(error);
      try {
        await this.cargarTablero(); // revierte cualquier cambio optimista
      } catch {
        /* el aviso de error ya se mostró */
      }
    } finally {
      this.guardando.set(false);
    }
  }

  private reportar(error: unknown): void {
    this.toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
  }
}
