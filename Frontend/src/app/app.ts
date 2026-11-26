import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from './components/principales/encabezado/encabezado';
import { Notificaciones } from './components/principales/notificaciones/notificaciones';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Encabezado, Notificaciones],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
