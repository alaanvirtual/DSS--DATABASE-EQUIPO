import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Boton } from '../boton/boton';
import { Icono } from '../icono/icono';

/**
 * Pantalla o bloque de error. Muestra el motivo y, por defecto, un botón
 * "Reintentar" que emite `reintentar`. El contenido proyectado se coloca debajo,
 * para acciones propias (p. ej. un enlace para volver al inicio).
 *
 *   <app-estado-error [icono]="e.icono" [titulo]="e.titulo" [descripcion]="e.descripcion"
 *     (reintentar)="recargar()" />
 *
 * Combínalo con `describirError(error)` (utils/describir-error.ts) para obtener
 * el ícono y los textos a partir de cualquier error de la API.
 */
@Component({
  selector: 'app-estado-error',
  imports: [Boton, Icono],
  templateUrl: './estado-error.html',
  styleUrl: './estado-error.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadoError {
  readonly icono = input('warning-circle');
  readonly titulo = input.required<string>();
  readonly descripcion = input<string | null>(null);
  readonly conAccion = input(true);
  readonly textoAccion = input('Reintentar');

  readonly reintentar = output<void>();
}
