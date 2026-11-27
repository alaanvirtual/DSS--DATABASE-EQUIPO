import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AvisoSesion } from './components/principales/aviso-sesion/aviso-sesion';
import { Encabezado } from './components/principales/encabezado/encabezado';
import { Notificaciones } from './components/principales/notificaciones/notificaciones';
import { Boton } from './components/secundarios/boton/boton';
import { Insignia } from './components/secundarios/insignia/insignia';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisoSesion, Encabezado, Notificaciones, Boton, Insignia],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

  readonly auth = inject(AuthService);

  salir(): void {
    this.auth.salir();
    void this.router.navigate(['/login']);
  }
}
