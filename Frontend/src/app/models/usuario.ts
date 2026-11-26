/** Usuario del sistema. Nunca se conserva la contraseña en el cliente. */
export interface Usuario {
  id: number;
  nombre: string;
  telefono: string | null;
  correo: string;
  usuario: string;
}
