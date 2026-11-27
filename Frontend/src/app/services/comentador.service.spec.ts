import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HERRAMIENTA } from '../models/agenda';
import { ErrorApi } from '../models/error-api';
import { Usuario } from '../models/usuario';
import { AuthService } from './auth.service';
import { CategoriasService } from './categorias.service';
import { ComentadorService } from './comentador.service';
import { ComentariosService } from './comentarios.service';
import { ProyectosService } from './proyectos.service';
import { ToastService } from './toast.service';
import { UsuariosService } from './usuarios.service';

describe('ComentadorService', () => {
  let servicio: ComentadorService;
  let usuarioAuth: ReturnType<typeof signal<Usuario | null>>;
  let categoriasApi: jasmine.SpyObj<CategoriasService>;
  let comentariosApi: jasmine.SpyObj<ComentariosService>;

  const juan: Usuario = { id: 1, nombre: 'Juan', telefono: null, correo: 'juan@test.com', usuario: 'juan' };
  const maria: Usuario = { id: 2, nombre: 'María', telefono: null, correo: 'maria@test.com', usuario: 'maria' };

  const datosTablero = {
    topico: { idproy: 1, id: 3, topico: 'categorizar alternativas', rol: 'FAC', idtool: HERRAMIENTA.CATEGORIZADOR },
    origen: { idproy: 1, id: 2, topico: 'definir alternativas', rol: 'DEC', idtool: HERRAMIENTA.LLUVIA_IDEAS },
    puedeEditar: false,
    ideas: [{ idproy: 1, idtopico: 2, idusuario: 2, id: 1, nombre: 'lenovo', objetivo: 'buena batería' }],
    categorias: [
      { idproy: 1, id: 1, idtopico: 3, nombre: 'lenovo' },
      { idproy: 1, id: 2, idtopico: 3, nombre: 'hp' }
    ],
    detalles: [{ idproy: 1, idcat: 1, idtopico: 2, idusuario: 2, ididea: 1 }]
  };

  beforeEach(() => {
    localStorage.clear();
    usuarioAuth = signal<Usuario | null>(maria);

    const proyectosApi = jasmine.createSpyObj<ProyectosService>('ProyectosService', [
      'listar',
      'listarParticipantes',
      'listarAgenda'
    ]);
    proyectosApi.listar.and.returnValue(
      of([{ id: 1, nombre: 'laptops', objetivo: 'elegir', fechainicio: null, fechafin: null, estatus: 1 }])
    );
    proyectosApi.listarParticipantes.and.returnValue(
      of([
        { idproy: 1, idusu: 1, rol: 'FAC' },
        { idproy: 1, idusu: 2, rol: 'DEC' }
      ])
    );
    proyectosApi.listarAgenda.and.returnValue(
      of([
        { idproy: 1, id: 2, topico: 'definir alternativas', rol: 'DEC', idtool: HERRAMIENTA.LLUVIA_IDEAS },
        { idproy: 1, id: 3, topico: 'categorizar alternativas', rol: 'FAC', idtool: HERRAMIENTA.CATEGORIZADOR },
        { idproy: 1, id: 4, topico: 'comentar alternativas', rol: 'DEC', idtool: HERRAMIENTA.COMENTADOR }
      ])
    );

    const usuariosApi = jasmine.createSpyObj<UsuariosService>('UsuariosService', ['listar']);
    usuariosApi.listar.and.returnValue(of([juan, maria]));

    categoriasApi = jasmine.createSpyObj<CategoriasService>('CategoriasService', ['cargarTablero']);
    categoriasApi.cargarTablero.and.returnValue(of(datosTablero));

    comentariosApi = jasmine.createSpyObj<ComentariosService>('ComentariosService', [
      'listar',
      'crear',
      'actualizar',
      'eliminar'
    ]);
    comentariosApi.listar.and.callFake((_idproy, idcat) =>
      of(idcat === 1 ? [{ idproy: 1, idcat: 1, idusuario: 2, comentario: 'Me parece sólida' }] : [])
    );
    comentariosApi.crear.and.callFake((idproy, idcat, idusuario, comentario) =>
      of({ idproy, idcat, idusuario, comentario })
    );
    comentariosApi.actualizar.and.callFake((idproy, idcat, idusuario, comentario) =>
      of({ idproy, idcat, idusuario, comentario })
    );
    comentariosApi.eliminar.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: { usuario: usuarioAuth } },
        { provide: ProyectosService, useValue: proyectosApi },
        { provide: UsuariosService, useValue: usuariosApi },
        { provide: CategoriasService, useValue: categoriasApi },
        { provide: ComentariosService, useValue: comentariosApi },
        ToastService
      ]
    });

    servicio = TestBed.inject(ComentadorService);
  });

  it('habilita comentarios para DEC y deja FAC en solo lectura según la agenda y el JWT', async () => {
    await servicio.iniciar();

    expect(categoriasApi.cargarTablero).toHaveBeenCalledWith(1, 3);
    expect(servicio.rolActual()).toBe('DEC');
    expect(servicio.puedeComentar()).toBeTrue();
    expect(servicio.resumenProgreso()).toEqual({ comentadas: 1, total: 2 });

    usuarioAuth.set(juan);
    expect(servicio.rolActual()).toBe('FAC');
    expect(servicio.puedeComentar()).toBeFalse();
  });

  it('crea, actualiza y elimina el comentario del decisor autenticado', async () => {
    await servicio.iniciar();

    const lenovo = servicio.categorias()[0];
    const hp = servicio.categorias()[1];

    // Categoría sin comentario previo → POST
    await servicio.guardarComentario(hp, 'Buen precio');
    expect(comentariosApi.crear).toHaveBeenCalledWith(1, 2, 2, 'Buen precio');
    expect(servicio.resumenProgreso()).toEqual({ comentadas: 2, total: 2 });

    // Categoría con comentario propio → PATCH
    await servicio.guardarComentario(lenovo, 'Excelente relación calidad-precio');
    expect(comentariosApi.actualizar).toHaveBeenCalledWith(
      1,
      1,
      2,
      'Excelente relación calidad-precio'
    );

    // Eliminar comentario propio → DELETE
    await servicio.eliminarComentario(hp);
    expect(comentariosApi.eliminar).toHaveBeenCalledWith(1, 2, 2);
    expect(servicio.resumenProgreso()).toEqual({ comentadas: 1, total: 2 });
  });

  it('registra errorCarga si falla cargarTablero y recupera al reintentar', async () => {
    categoriasApi.cargarTablero.and.returnValue(throwError(() => new ErrorApi('Sin conexión', 0)));
    await servicio.iniciar();

    expect(servicio.errorCarga()?.icono).toBe('wifi-slash');

    categoriasApi.cargarTablero.and.returnValue(of(datosTablero));
    await servicio.reintentar();

    expect(servicio.errorCarga()).toBeNull();
    expect(servicio.tarjetas().length).toBe(2);
  });
});
