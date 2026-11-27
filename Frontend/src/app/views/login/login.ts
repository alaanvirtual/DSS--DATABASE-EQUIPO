import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { CampoTexto } from '../../components/secundarios/campo-texto/campo-texto';
import { Icono } from '../../components/secundarios/icono/icono';
import { ErrorApi } from '../../models/error-api';
import { AuthService } from '../../services/auth.service';
import { DescripcionError, describirError } from '../../utils/describir-error';
import { rutaSegura } from '../../utils/ruta-segura';

const DESTINO_POR_DEFECTO = '/inicio';

/** Vista de inicio de sesión. Ruta: /login */
@Component({
  selector: 'app-login',
  imports: [Boton, CampoTexto, Icono],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly usuario = signal('');
  protected readonly passw = signal('');
  protected readonly enviando = signal(false);

  /** Fallo devuelto por el servidor (credenciales, sin conexión...). */
  protected readonly error = signal<DescripcionError | null>(null);
  /** Aviso informativo, por ejemplo "tu sesión terminó". */
  protected readonly aviso = signal<string | null>(null);

  // Los errores de cada campo aparecen al salir de él o al intentar enviar.
  private readonly intentado = signal(false);
  private readonly tocados = signal({ usuario: false, passw: false });

  private readonly campoUsuario = viewChild.required<CampoTexto>('campoUsuario');
  private readonly campoPassw = viewChild.required<CampoTexto>('campoPassw');

  protected readonly errorUsuario = computed(() =>
    (this.intentado() || this.tocados().usuario) && !this.usuario().trim()
      ? 'Escribe tu usuario'
      : null
  );

  protected readonly errorPassw = computed(() =>
    (this.intentado() || this.tocados().passw) && !this.passw() ? 'Escribe tu contraseña' : null
  );

  ngOnInit(): void {
    if (this.auth.autenticado()) {
      void this.router.navigateByUrl(this.destino());
      return;
    }

    if (this.ruta.snapshot.queryParamMap.get('motivo') === 'expirada') {
      this.aviso.set('Tu sesión terminó. Inicia sesión de nuevo para continuar.');
    }
  }

  protected tocar(campo: 'usuario' | 'passw'): void {
    this.tocados.update((actual) => ({ ...actual, [campo]: true }));
  }

  protected async entrar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.enviando()) return;

    this.intentado.set(true);
    this.error.set(null);

    if (this.errorUsuario()) {
      this.campoUsuario().enfocar();
      return;
    }

    if (this.errorPassw()) {
      this.campoPassw().enfocar();
      return;
    }

    this.enviando.set(true);

    try {
      await this.auth.login({ usuario: this.usuario().trim(), passw: this.passw() });
      await this.router.navigateByUrl(this.destino());
    } catch (error) {
      this.error.set(this.describir(error));

      // Solo si las credenciales son incorrectas se vacía la contraseña. Si falló la
      // conexión o el servidor, se conservan los datos para reintentar sin volver a escribir.
      if (error instanceof ErrorApi && error.estado === 401) {
        this.reiniciarValidacion();
        this.passw.set('');
        this.campoPassw().enfocar();
      }
    } finally {
      this.enviando.set(false);
    }
  }

  /** A dónde ir tras entrar: la página que se pedía antes del login, o el inicio. */
  private destino(): string {
    return rutaSegura(this.ruta.snapshot.queryParamMap.get('volver')) ?? DESTINO_POR_DEFECTO;
  }

  private describir(error: unknown): DescripcionError {
    if (error instanceof ErrorApi && error.estado === 401) {
      return {
        icono: 'warning-circle',
        titulo: 'No pudimos iniciar sesión',
        descripcion: 'El usuario o la contraseña no son correctos. Revisa tus datos e inténtalo de nuevo.',
        reintentable: true
      };
    }

    return describirError(error);
  }

  private reiniciarValidacion(): void {
    this.intentado.set(false);
    this.tocados.set({ usuario: false, passw: false });
  }
}
