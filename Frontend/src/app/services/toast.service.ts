import { Injectable, signal } from '@angular/core';
import { TipoToast, Toast } from '../models/toast';

/** Avisos temporales para el usuario. Se muestran con <app-notificaciones />. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguiente = 1;
  readonly toasts = signal<Toast[]>([]);

  mostrar(tipo: TipoToast, mensaje: string, duracionMs = 4000): void {
    const id = this.siguiente++;
    this.toasts.update((lista) => [...lista, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje, 6000);
  }

  cerrar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }
}
