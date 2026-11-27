import { HERRAMIENTA, TopicoAgenda } from '../models/agenda';
import { rolIncluye, topicoOrigen, topicoPrevio } from './topico-origen';

const t = (id: number, idtool: number): TopicoAgenda => ({
  idproy: 1,
  id,
  topico: `t${id}`,
  rol: 'DEC',
  idtool
});

describe('topicoPrevio', () => {
  const agenda = [t(1, 1), t(2, 2), t(3, 3), t(4, 4), t(5, 5), t(6, 2), t(7, 3), t(8, 4)];

  it('devuelve el tópico previo más cercano de la herramienta solicitada', () => {
    expect(topicoPrevio(agenda, agenda[3], HERRAMIENTA.CATEGORIZADOR)?.id).toBe(3);
    expect(topicoPrevio(agenda, agenda[7], HERRAMIENTA.CATEGORIZADOR)?.id).toBe(7);
    expect(topicoPrevio(agenda, agenda[7], HERRAMIENTA.LLUVIA_IDEAS)?.id).toBe(6);
  });

  it('devuelve undefined si no existe un tópico anterior de esa herramienta', () => {
    expect(topicoPrevio(agenda, undefined, HERRAMIENTA.CATEGORIZADOR)).toBeUndefined();
    expect(topicoPrevio([t(1, 4)], t(1, 4), HERRAMIENTA.CATEGORIZADOR)).toBeUndefined();
  });
});

describe('topicoOrigen', () => {
  const agenda = [t(1, 1), t(2, 2), t(3, 3), t(4, 4), t(5, 5), t(6, 2), t(7, 3)];

  it('devuelve la lluvia de ideas inmediatamente anterior', () => {
    expect(topicoOrigen(agenda, agenda[2])?.id).toBe(2);
    expect(topicoOrigen(agenda, agenda[3])?.id).toBe(2);
    expect(topicoOrigen(agenda, agenda[6])?.id).toBe(6);
  });

  it('devuelve undefined si no hay tópico actual o no hay lluvia previa', () => {
    expect(topicoOrigen(agenda, undefined)).toBeUndefined();
    expect(topicoOrigen([t(1, 3)], t(1, 3))).toBeUndefined();
  });
});

describe('rolIncluye', () => {
  it('reconoce roles en listas separadas por coma', () => {
    expect(rolIncluye('FAC, DEC', 'FAC')).toBeTrue();
    expect(rolIncluye('DEC', 'FAC')).toBeFalse();
  });
});
