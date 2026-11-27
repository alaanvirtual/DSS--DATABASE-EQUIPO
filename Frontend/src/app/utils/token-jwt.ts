/**
 * Instante (ms desde 1970) en que vence un JWT, leído de su campo `exp`.
 * Devuelve null si el token no se puede leer. No verifica la firma: eso lo hace el servidor;
 * aquí solo sirve para avisar al usuario antes de que la sesión venza.
 */
export function expiracionDelToken(token: string): number | null {
  try {
    const carga = token.split('.')[1];
    if (!carga) return null;

    const base64 = carga.replace(/-/g, '+').replace(/_/g, '/');
    const completo = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const exp = (JSON.parse(atob(completo)) as { exp?: unknown }).exp;

    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
