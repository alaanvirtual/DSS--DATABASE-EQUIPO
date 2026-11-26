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
import { siguienteId } from '../utils/siguiente-id';
import { rolIncluye, topicoOrigen } from '../utils/topico-origen';
import { BrainstormingService } from './brainstorming.service';
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
  private readonly brainstormingApi = inject(BrainstormingService);
  private readonly toast = inject(ToastService);
  private readonly sesion = inject(SesionService);

  // ── Contexto ──────────────────────────────────────────────────────────
  readonly proyectos = signal<Proyecto[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly participantes = signal<Participante[]>([]);
  readonly agenda = signal<TopicoAgenda[]>([]);
  readonly idtopico = signal<number | null>(null);
  readonly idproy = this.sesion.idproy.asReadonly();
  readonly idusuario = this.sesion.idusuario.asReadonly();

  // ── Datos del tablero ─────────────────────────────────────────────────
  readonly ideas = signal<Idea[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly detalles = signal<CategoriaDetalle[]>([]);

  // ── Estado de carga ───────────────────────────────────────────────────
  readonly cargando = signal(false);
  readonly guardando = signal(false);

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

  /** Solo el facilitador edita, y solo si la agenda del tópico lo permite. */
  readonly puedeEditar = computed(() => {
    const topico = this.topicoActual();
    return this.rolActual() === 'FAC' && !!topico && rolIncluye(topico.rol, 'FAC');
  });

  private readonly nombresUsuarios = computed(
    () => new Map(this.usuarios().map((u) => [u.id, u.nombre]))
  );

  private readonly ideasPorClave = computed(
    () => new Map(this.ideas().map((i) => [claveIdea(i), i]))
  );

  /**
   * Las categorías pertenecen al proyecto, no a un tópico (limitación del esquema).
   * Se muestran las que contienen ideas de este tópico y las que aún están vacías.
   */
  readonly categoriasVisibles = computed(() => {
    const origen = this.topicoOrigenActual()?.id;
    const detalles = this.detalles();

    return this.categorias().filter((cat) => {
      const propios = detalles.filter((d) => d.idcat === cat.id);
      return propios.length === 0 || propios.some((d) => d.idtopico === origen);
    });
  });

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
    await this.conCarga(async () => {
      const [proyectos, usuarios] = await Promise.all([
        firstValueFrom(this.proyectosApi.listar()),
        firstValueFrom(this.usuariosApi.listar())
      ]);
      this.proyectos.set(proyectos);
      this.usuarios.set(usuarios);

      const inicial = proyectos.find((p) => p.id === this.idproy()) ?? proyectos[0];
      if (inicial) await this.cargarProyecto(inicial.id);
    });
  }

  async seleccionarProyecto(idproy: number): Promise<void> {
    await this.conCarga(() => this.cargarProyecto(idproy));
  }

  seleccionarUsuario(idusuario: number): void {
    this.sesion.idusuario.set(idusuario);
  }

  async seleccionarTopico(idtopico: number): Promise<void> {
    this.idtopico.set(idtopico);
    await this.conCarga(() => this.cargarTablero());
  }

  // ── Acciones sobre categorías ─────────────────────────────────────────

  async crearCategoria(nombre: string): Promise<void> {
    const idproy = this.idproy();
    if (idproy === null) return;

    await this.mutar(async () => {
      const id = siguienteId(this.categorias());
      await firstValueFrom(this.categoriasApi.crear(idproy, id, nombre));
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

      if (!yaEstaba) await firstValueFrom(this.categoriasApi.asignarIdea(idproy, destino, idea));
      if (arrastre.origen !== null) {
        await firstValueFrom(this.categoriasApi.quitarIdea(idproy, arrastre.origen, idea));
      }
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
      await firstValueFrom(this.categoriasApi.quitarIdea(idproy, idcat, idea));
    });
  }

  /** Devuelve a "sin categorizar" una idea arrastrada desde una categoría. */
  async desasignarArrastre(arrastre: ArrastreIdea): Promise<void> {
    if (arrastre.origen === null) return;

    const idea = this.ideasPorClave().get(arrastre.clave);
    if (idea) await this.quitarIdea(idea, arrastre.origen);
  }

  // ── Internos ──────────────────────────────────────────────────────────

  private async cargarProyecto(idproy: number): Promise<void> {
    this.sesion.idproy.set(idproy);

    const [participantes, agenda] = await Promise.all([
      firstValueFrom(this.proyectosApi.listarParticipantes(idproy)),
      firstValueFrom(this.proyectosApi.listarAgenda(idproy))
    ]);
    this.participantes.set(participantes);
    this.agenda.set(agenda);

    if (!participantes.some((p) => p.idusu === this.idusuario())) {
      const preferido = participantes.find((p) => p.rol === 'FAC') ?? participantes[0];
      this.sesion.idusuario.set(preferido?.idusu ?? null);
    }

    const topicos = this.topicosCategorizador();
    this.idtopico.set((topicos.find((t) => t.id === this.idtopico()) ?? topicos[0])?.id ?? null);

    await this.cargarTablero();
  }

  private async cargarTablero(): Promise<void> {
    const idproy = this.idproy();
    const origen = this.topicoOrigenActual();

    if (idproy === null) {
      this.ideas.set([]);
      this.categorias.set([]);
      this.detalles.set([]);
      return;
    }

    const [categorias, ideas] = await Promise.all([
      firstValueFrom(this.categoriasApi.listar(idproy)),
      origen
        ? firstValueFrom(this.brainstormingApi.listar(idproy, origen.id))
        : Promise.resolve([] as Idea[])
    ]);

    const detalles = (
      await Promise.all(
        categorias.map((c) => firstValueFrom(this.categoriasApi.listarDetalle(idproy, c.id)))
      )
    ).flat();

    this.categorias.set(categorias);
    this.ideas.set(ideas);
    this.detalles.set(detalles);
  }

  private async conCarga(accion: () => Promise<void>): Promise<void> {
    this.cargando.set(true);
    try {
      await accion();
    } catch (error) {
      this.reportar(error);
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
