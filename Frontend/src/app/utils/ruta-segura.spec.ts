import { rutaSegura } from './ruta-segura';

describe('rutaSegura', () => {
  it('acepta rutas internas', () => {
    expect(rutaSegura('/categorizador')).toBe('/categorizador');
    expect(rutaSegura('/chat?topico=2')).toBe('/chat?topico=2');
  });

  it('rechaza lo que no es una ruta interna', () => {
    expect(rutaSegura(null)).toBeNull();
    expect(rutaSegura('')).toBeNull();
    expect(rutaSegura('categorizador')).toBeNull();
    expect(rutaSegura('https://sitio-malo.com')).toBeNull();
    expect(rutaSegura('//sitio-malo.com')).toBeNull();
    expect(rutaSegura('/\\sitio-malo.com')).toBeNull();
  });

  it('descarta la ruta del propio login', () => {
    expect(rutaSegura('/login')).toBeNull();
    expect(rutaSegura('/login?volver=/inicio')).toBeNull();
  });
});
