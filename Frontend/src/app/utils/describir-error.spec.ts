import { ErrorApi } from '../models/error-api';
import { describirError } from './describir-error';

describe('describirError', () => {
  it('distingue la falta de conexión', () => {
    const resultado = describirError(new ErrorApi('No se pudo conectar con el servidor', 0));
    expect(resultado.titulo).toBe('Sin conexión con el servidor');
    expect(resultado.icono).toBe('wifi-slash');
  });

  it('usa el mensaje de la API en un 404', () => {
    const resultado = describirError(new ErrorApi('Proyecto no encontrado', 404));
    expect(resultado.icono).toBe('magnifying-glass');
    expect(resultado.descripcion).toBe('Proyecto no encontrado');
  });

  it('no expone el detalle de un error 5xx', () => {
    const resultado = describirError(new ErrorApi('Error interno del servidor', 503));
    expect(resultado.titulo).toBe('El servidor tuvo un problema');
    expect(resultado.descripcion).not.toContain('Error interno');
  });

  it('describe un error genérico con su mensaje', () => {
    const resultado = describirError(new Error('Falló algo'));
    expect(resultado.titulo).toBe('Algo salió mal');
    expect(resultado.descripcion).toBe('Falló algo');
  });

  it('tolera valores que no son errores', () => {
    expect(describirError('texto').descripcion).toBe('Ocurrió un error inesperado');
  });
});
