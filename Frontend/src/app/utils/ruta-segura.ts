/**
 * Ruta interna a la que volver después de iniciar sesión. Solo acepta rutas de la propia
 * aplicación (evita redirigir a otros sitios) y descarta la del propio login.
 */
export function rutaSegura(valor: string | null | undefined): string | null {
  if (!valor || !valor.startsWith('/')) return null;
  if (valor.startsWith('//') || valor.startsWith('/\\')) return null;
  if (valor === '/login' || valor.startsWith('/login?')) return null;

  return valor;
}
