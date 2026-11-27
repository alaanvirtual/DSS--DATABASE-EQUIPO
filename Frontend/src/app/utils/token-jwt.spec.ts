import { expiracionDelToken } from './token-jwt';

const codificar = (objeto: object): string =>
  btoa(JSON.stringify(objeto)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const crearToken = (carga: object): string =>
  `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar(carga)}.firma`;

describe('expiracionDelToken', () => {
  it('devuelve el vencimiento en milisegundos', () => {
    expect(expiracionDelToken(crearToken({ sub: '1', exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it('devuelve null si el token no trae exp', () => {
    expect(expiracionDelToken(crearToken({ sub: '1' }))).toBeNull();
  });

  it('devuelve null si el token no se puede leer', () => {
    expect(expiracionDelToken('esto-no-es-un-token')).toBeNull();
    expect(expiracionDelToken('a.@@@.c')).toBeNull();
    expect(expiracionDelToken('')).toBeNull();
  });
});
