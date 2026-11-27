import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HERRAMIENTA, TopicoAgenda } from '../models/agenda';
import { Categoria } from '../models/categoria';
import { CategoriaDetalle } from '../models/categoria-detalle';
import {
  Comentario,
  ComentarioConAutor,
  TarjetaCategoriaComentarios
} from '../models/comentario';
import { Idea, IdeaConAutor } from '../models/idea';
import { Participante, Rol } from '../models/participante';
import { Proyecto } from '../models/proyecto';
import { Usuario } from '../models/usuario';
import { claveDeDetalle, claveIdea } from '../utils/clave-idea';
import { DescripcionError, describirError } from '../utils/describir-error';
import { rolIncluye, topicoOrigen, topicoPrevio } from '../utils/topico-origen';
import { AuthService } from './auth.service';
import { CategoriasService } from './categorias.service';
import { ComentariosService } from './comentarios.service';
import { ProyectosService } from './proyectos.service';
import { SesionService } from './sesion.service';
import { ToastService } from './toast.service';
import { UsuariosService } from './usuarios.service';

function conAutor(idea: Idea, nombres: Map<number, string>): IdeaConAutor {
  return { ...idea, autor: nombres.get(idea.idusuario) ?? `Usuario ${idea.idusuario}` };
}

function comentarioEnriquecido(
  item: Comentario,
  nombres: Map<number, string>,
  roles: Map<number, Rol>,
  idusuarioActual: number | null
): ComentarioConAutor {
  return {
    ...item,
    autor: nombres.get(item.idusuario) ?? `Usuario ${item.idusuario}`,
    rol: roles.get(item.idusuario) ?? null,
    esPropio: item.idusuario === idusuarioActual
  };
}

/**
 * Estado y acciones de la herramienta Comentador (herramienta 4 del SADMG).
 *
 * Los decisores revisan las categorías del categorizador previo y emiten
 * retroalimentación (un comentario editable por categoría y decisor).
 * Los componentes solo leen señales y llaman a estas acciones.
 */
@Injectable({ providedIn: 'root' })
export class ComentadorService {
  private readonly proyectosApi = inject(ProyectosService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly categoriasApi = inject(CategoriasService);
  private readonly comentariosApi = inject(ComentariosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly sesion = inject(SesionService);

  // ── Contexto ──────────────────────────────────────────────────────────
  readonly proyectos = signal<Proyecto[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly participantes = signal<Participante[]>([]);
  readonly agenda = signal<TopicoAgenda[]>([]);
  readonly idtopico = signal<number | null>(null);
  readonly idproy = this.sesion.idproy.asReadonly();
  readonly idusuario = computed(() => this.auth.usuario()?.id ?? this.sesion.idusuario());

  // ── Datos del tablero ─────────────────────────────────────────────────
  readonly ideas = signal<Idea[]>([]);
  /** Categorías del tópico categorizador inmediato anterior. */
  readonly categorias = signal<Categoria[]>([]);
  readonly detalles = signal<CategoriaDetalle[]>([]);
  readonly comentarios = signal<Comentario[]>([]);

  // ── Estado de carga ───────────────────────────────────────────────────
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  /** Fallo de la última carga (no de una edición): la pantalla muestra el error con "Reintentar". */
  readonly errorCarga = signal<DescripcionError | null>(null);

  private ultimaCarga: () => Promise<void> = () => this.cargarInicial();

  // ── Derivados ─────────────────────────────────────────────────────────
  readonly topicosComentador = computed(() =>
    this.agenda().filter((t) => t.idtool === HERRAMIENTA.COMENTADOR)
  );

  readonly topicoActual = computed(() =>
    this.topicosComentador().find((t) => t.id === this.idtopico())
  );

  /** Tópico de categorización inmediato anterior que produjo las categorías a comentar. */
  readonly topicoCategorizadorActual = computed(() =>
    topicoPrevio(this.agenda(), this.topicoActual(), HERRAMIENTA.CATEGORIZADOR)
  );

  /** Tópico de lluvia de ideas de origen (informativo). */
  readonly topicoOrigenActual = computed(() => topicoOrigen(this.agenda(), this.topicoActual()));

  readonly rolActual = computed(
    () => this.participantes().find((p) => p.idusu === this.idusuario())?.rol ?? null
  );

  /**
   * Solo los decisores (`DEC`) pueden escribir comentarios en el servidor (`permitirEscritura(['DEC'])`
   * + `soloPropio`), y solo cuando la agenda del tópico habilita el rol `DEC`.
   */
  readonly puedeComentar = computed(() => {
    const topico = this.topicoActual();
    return this.rolActual() === 'DEC' && !!topico && rolIncluye(topico.rol, 'DEC');
  });

  private readonly nombresUsuarios = computed(
    () => new Map(this.usuarios().map((u) => [u.id, u.nombre]))
  );

  private readonly rolesParticipantes = computed(
    () => new Map(this.participantes().map((p) => [p.idusu, p.rol]))
  );

  private readonly ideasPorClave = computed(
    () => new Map(this.ideas().map((i) => [claveIdea(i), i]))
  );

  readonly tarjetas = computed<TarjetaCategoriaComentarios[]>(() => {
    const ideas = this.ideasPorClave();
    const nombres = this.nombresUsuarios();
    const roles = this.rolesParticipantes();
    const detalles = this.detalles();
    const comentarios = this.comentarios();
    const idusuario = this.idusuario();

    return this.categorias().map((categoria) => {
      const listaComentarios = comentarios
        .filter((c) => c.idcat === categoria.id)
        .map((c) => comentarioEnriquecido(c, nombres, roles, idusuario));

      return {
        categoria,
        ideas: detalles
          .filter((d) => d.idcat === categoria.id)
          .map((d) => ideas.get(claveDeDetalle(d)))
          .filter((i): i is Idea => !!i)
          .map((i) => conAutor(i, nombres)),
        comentarios: listaComentarios,
        comentarioPropio: listaComentarios.find((c) => c.esPropio) ?? null
      };
    });
  });

  /** Progreso del participante actual sobre las categorías del tópico. */
  readonly resumenProgreso = computed(() => {
    const tarjetas = this.tarjetas();
    return {
      comentadas: tarjetas.filter((t) => t.comentarioPropio !== null).length,
      total: tarjetas.length
    };
  });

  // ── Carga ─────────────────────────────────────────────────────────────

  async iniciar(): Promise<void> {
    this.ultimaCarga = () => this.cargarInicial();
    await this.conCarga(this.ultimaCarga);
  }

  async reintentar(): Promise<void> {
    await this.conCarga(this.ultimaCarga);
  }

  async seleccionarProyecto(idproy: number): Promise<void> {
    this.ultimaCarga = () => this.cargarProyecto(idproy);
    await this.conCarga(this.ultimaCarga);
  }

  async seleccionarTopico(idtopico: number): Promise<void> {
    this.idtopico.set(idtopico);
    this.ultimaCarga = () => this.cargarTablero();
    await this.conCarga(this.ultimaCarga);
  }

  // ── Acciones sobre comentarios ────────────────────────────────────────

  /** Crea el comentario del usuario autenticado en la categoría, o actualiza el existente. */
  async guardarComentario(categoria: Categoria, texto: string): Promise<void> {
    const idproy = this.idproy();
    const idusuario = this.idusuario();
    const limpio = texto.trim();

    if (idproy === null || idusuario === null || !limpio || !this.puedeComentar()) return;

    const existe = this.comentarios().some(
      (c) => c.idcat === categoria.id && c.idusuario === idusuario
    );

    await this.mutar(
      async () => {
        // Actualización optimista: la interfaz responde sin esperar a la API.
        const registro: Comentario = {
          idproy,
          idcat: categoria.id,
          idusuario,
          comentario: limpio
        };

        this.comentarios.update((lista) =>
          existe
            ? lista.map((c) =>
                c.idcat === categoria.id && c.idusuario === idusuario ? registro : c
              )
            : [...lista, registro]
        );

        if (existe) {
          await firstValueFrom(
            this.comentariosApi.actualizar(idproy, categoria.id, idusuario, limpio)
          );
        } else {
          await firstValueFrom(this.comentariosApi.crear(idproy, categoria.id, idusuario, limpio));
        }
      },
      existe ? 'Comentario actualizado' : 'Comentario publicado'
    );
  }

  /** Elimina el comentario del usuario autenticado en la categoría indicada. */
  async eliminarComentario(categoria: Categoria): Promise<void> {
    const idproy = this.idproy();
    const idusuario = this.idusuario();

    if (idproy === null || idusuario === null || !this.puedeComentar()) return;

    await this.mutar(async () => {
      this.comentarios.update((lista) =>
        lista.filter((c) => !(c.idcat === categoria.id && c.idusuario === idusuario))
      );

      await firstValueFrom(this.comentariosApi.eliminar(idproy, categoria.id, idusuario));
    }, 'Comentario eliminado');
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

    const topicos = this.topicosComentador();
    this.idtopico.set((topicos.find((t) => t.id === this.idtopico()) ?? topicos[0])?.id ?? null);

    await this.cargarTablero();
  }

  private async cargarTablero(): Promise<void> {
    const idproy = this.idproy();
    const categorizador = this.topicoCategorizadorActual();

    if (idproy === null || !categorizador) {
      this.ideas.set([]);
      this.categorias.set([]);
      this.detalles.set([]);
      this.comentarios.set([]);
      return;
    }

    // Una sola petición trae las ideas, categorías (ya filtradas por tópico) y asignaciones.
    const datos = await firstValueFrom(this.categoriasApi.cargarTablero(idproy, categorizador.id));

    const comentariosPorCat = await Promise.all(
      datos.categorias.map((c) => firstValueFrom(this.comentariosApi.listar(idproy, c.id)))
    );

    this.ideas.set(datos.ideas);
    this.categorias.set(datos.categorias);
    this.detalles.set(datos.detalles);
    this.comentarios.set(comentariosPorCat.flat());
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
