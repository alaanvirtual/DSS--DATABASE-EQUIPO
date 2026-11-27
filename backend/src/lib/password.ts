import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// Hash de contraseñas con scrypt (módulo nativo de Node: sin dependencias extra).
// Formato almacenado: scrypt$N$r$p$sal$hash  (sal y hash en base64url).
// Los parámetros viajan dentro del hash, así que se pueden endurecer más adelante
// sin invalidar los hashes existentes.

const PREFIJO = 'scrypt';
const N = 16384;
const R = 8;
const P = 1;
const LONGITUD_CLAVE = 32;
const LONGITUD_SAL = 16;

function derivar(
  password: string,
  sal: Buffer,
  longitud: number,
  n: number,
  r: number,
  p: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, sal, longitud, { N: n, r, p }, (error, clave) => {
      if (error) reject(error);
      else resolve(clave);
    });
  });
}

/** Indica si el valor guardado ya es un hash de este módulo (y no texto plano heredado). */
export function esHash(valor: string): boolean {
  return valor.startsWith(`${PREFIJO}$`);
}

export async function hashPassword(password: string): Promise<string> {
  const sal = randomBytes(LONGITUD_SAL);
  const clave = await derivar(password, sal, LONGITUD_CLAVE, N, R, P);

  return [PREFIJO, N, R, P, sal.toString('base64url'), clave.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, almacenado: string): Promise<boolean> {
  const partes = almacenado.split('$');
  if (partes.length !== 6 || partes[0] !== PREFIJO) return false;

  const [, n, r, p, sal, hash] = partes;
  if (!n || !r || !p || !sal || !hash) return false;

  const esperado = Buffer.from(hash, 'base64url');
  const obtenido = await derivar(
    password,
    Buffer.from(sal, 'base64url'),
    esperado.length,
    Number(n),
    Number(r),
    Number(p)
  );

  return esperado.length === obtenido.length && timingSafeEqual(esperado, obtenido);
}

// Hash de relleno: se verifica contra él cuando el usuario no existe, para que
// el tiempo de respuesta no revele si un usuario está registrado.
let hashDeRelleno: Promise<string> | undefined;

export async function fingirVerificacion(password: string): Promise<void> {
  hashDeRelleno ??= hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, await hashDeRelleno);
}
