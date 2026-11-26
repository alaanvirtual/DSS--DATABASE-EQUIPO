import { siguienteId } from './siguiente-id';

describe('siguienteId', () => {
  it('empieza en 1 cuando no hay elementos', () => {
    expect(siguienteId([])).toBe(1);
  });

  it('devuelve el máximo + 1 aunque haya huecos', () => {
    expect(siguienteId([{ id: 1 }, { id: 4 }, { id: 2 }])).toBe(5);
  });
});
