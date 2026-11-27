import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { CampoTexto } from '../../components/secundarios/campo-texto/campo-texto';
import { AuthService } from '../../services/auth.service';

/** Vista de inicio de sesión. Ruta: /login */
@Component({
  selector: 'app-login',
  imports: [CampoTexto, Boton],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = signal('');
  readonly passw = signal('');
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.autenticado()) void this.router.navigate(['/inicio']);
  }

  protected async entrar(): Promise<void> {
    const usuario = this.usuario().trim();
    const passw = this.passw();

    if (!usuario || !passw || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);

    try {
      await this.auth.login({ usuario, passw });
      void this.router.navigate(['/inicio']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
    } finally {
      this.enviando.set(false);
    }
  }
}
