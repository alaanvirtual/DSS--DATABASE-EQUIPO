import { formatearFecha, iniciales, rolDeAgenda } from './formato';

describe('iniciales', () => {
  it('toma la inicial de las dos primeras palabras', () => {
    expect(iniciales('Ana López Pérez')).toBe('AL');
    expect(iniciales('juan')).toBe('J');
  });

  it('tolera espacios y nombres vacíos', () => {
    expect(iniciales('  carlos   ruiz ')).toBe('CR');
    expect(iniciales('')).toBe('?');
    expect(iniciales('   ')).toBe('?');
  });
});

describe('formatearFecha', () => {
  it('da formato legible a una fecha ISO', () => {
    const texto = formatearFecha('2026-01-30');
    expect(texto).toContain('2026');
    expect(texto).toContain('30');
  });

  it('acepta una fecha con hora', () => {
    expect(formatearFecha('2026-01-30T00:00:00.000Z')).toContain('2026');
  });

  it('devuelve null si no hay fecha válida', () => {
    expect(formatearFecha(null)).toBeNull();
    expect(formatearFecha('')).toBeNull();
    expect(formatearFecha('no-es-fecha')).toBeNull();
  });
});

describe('rolDeAgenda', () => {
  it('traduce los roles de la agenda', () => {
    expect(rolDeAgenda('FAC, DEC')).toBe('Todos');
    expect(rolDeAgenda('FAC')).toBe('Facilitador');
    expect(rolDeAgenda('DEC')).toBe('Decisores');
  });

  it('deja tal cual un valor desconocido', () => {
    expect(rolDeAgenda('otro')).toBe('otro');
  });
});
