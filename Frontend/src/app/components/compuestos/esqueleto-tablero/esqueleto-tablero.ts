import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Esqueleto } from '../../secundarios/esqueleto/esqueleto';

@Component({
  selector: 'app-esqueleto-tablero',
  imports: [Esqueleto],
  templateUrl: './esqueleto-tablero.html',
  styleUrl: './esqueleto-tablero.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsqueletoTablero {
  protected readonly tarjetas = [1, 2, 3, 4];
  protected readonly columnas = [1, 2, 3];
}
