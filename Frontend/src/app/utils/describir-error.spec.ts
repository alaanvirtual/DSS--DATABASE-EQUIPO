import { ErrorApi } from '../models/error-api';
import { describirError } from './describir-error';

describe('describirError', () => {
  it('distingue la falta de conexión', () => {
    const resultado = describirError(new ErrorApi('No se pudo conectar con el servidor', 0));
    expect(resultado.titulo).toBe('Sin conexión con el servidor');
    expect(resultado.icono).toBe('wifi-slash');
    expect(resultado.reintentable).toBeTrue();
  });

  it('explica un 403 con el motivo del servidor y sin reintento', () => {
    const resultado = describirError(new ErrorApi('No participas en este proyecto', 403));
    expect(resultado.titulo).toBe('No tienes permiso');
    expect(resultado.icono).toBe('prohibit');
    expect(resultado.descripcion).toBe('No participas en este proyecto');
    expect(resultado.reintentable).toBeFalse();
  });

  it('pide iniciar sesión de nuevo en un 401', () => {
    const resultado = describirError(new ErrorApi('La sesión no es válida o ya expiró', 401));
    expect(resultado.titulo).toBe('Tu sesión no es válida');
    expect(resultado.reintentable).toBeFalse();
  });

  it('usa el mensaje de la API en un 404 y no sugiere reintentar', () => {
    const resultado = describirError(new ErrorApi('Proyecto no encontrado', 404));
    expect(resultado.icono).toBe('magnifying-glass');
    expect(resultado.descripcion).toBe('Proyecto no encontrado');
    expect(resultado.reintentable).toBeFalse();
  });

  it('no expone el detalle de un error 5xx y sí permite reintentar', () => {
    const resultado = describirError(new ErrorApi('Error interno del servidor', 503));
    expect(resultado.titulo).toBe('El servidor tuvo un problema');
    expect(resultado.descripcion).not.toContain('Error interno');
    expect(resultado.reintentable).toBeTrue();
  });

  it('describe un error genérico con su mensaje', () => {
    const resultado = describirError(new Error('Falló algo'));
    expect(resultado.titulo).toBe('Algo salió mal');
    expect(resultado.descripcion).toBe('Falló algo');
    expect(resultado.reintentable).toBeTrue();
  });

  it('tolera valores que no son errores', () => {
    expect(describirError('texto').descripcion).toBe('Ocurrió un error inesperado');
  });
});
