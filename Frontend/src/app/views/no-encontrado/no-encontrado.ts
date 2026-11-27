import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Boton } from '../../components/secundarios/boton/boton';
import { EstadoError } from '../../components/secundarios/estado-error/estado-error';

/** Pantalla 404: cualquier ruta que no existe. Ruta: ** */
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, Boton, EstadoError],
  template: `
    <app-estado-error
      icono="compass"
      titulo="Página no encontrada"
      descripcion="La dirección que buscas no existe o fue movida."
      [conAccion]="false"
    >
      <app-boton variante="primario" icono="house" routerLink="/inicio">Ir al inicio</app-boton>
    </app-estado-error>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoEncontrado {}
