import { rolIncluye } from './topico-origen';

/** Iniciales (hasta dos) de un nombre, para el avatar: "Ana López" → "AL". */
export function iniciales(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase());

  return letras.join('') || '?';
}

/** Fecha ISO ("2026-01-30") en formato corto ("30 ene 2026"); null si no hay fecha o no es válida. */
export function formatearFecha(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return null;

  // Se construye con año, mes y día para que la zona horaria no mueva la fecha.
  const fecha = new Date(anio, mes - 1, dia);
  if (Number.isNaN(fecha.getTime())) return null;

  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Quién participa en un tópico de la agenda ("FAC", "DEC" o "FAC, DEC"), en lenguaje natural. */
export function rolDeAgenda(rol: string): string {
  const facilitador = rolIncluye(rol, 'FAC');
  const decisores = rolIncluye(rol, 'DEC');

  if (facilitador && decisores) return 'Todos';
  if (facilitador) return 'Facilitador';
  if (decisores) return 'Decisores';

  return rol;
}
