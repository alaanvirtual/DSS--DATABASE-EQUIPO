import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import { Icono } from '../icono/icono';

let contador = 0;

/**
 * Campo de texto con etiqueta. Enlace bidireccional: [(valor)]="señal". Enter emite `enviar`.
 *
 * - `error`: mensaje de validación; marca el campo y lo anuncia a lectores de pantalla.
 * - `autocompletar`: valor del atributo autocomplete ("username", "current-password"...).
 * - `tipo="password"`: agrega el botón para mostrar u ocultar y avisa si Bloq Mayús está activo.
 * - `desenfocar`: se emite al perder el foco (útil para validar al salir del campo).
 * - `enfocar()`: pasa el foco al campo desde el componente padre.
 */
@Component({
  selector: 'app-campo-texto',
  imports: [Icono],
  templateUrl: './campo-texto.html',
  styleUrl: './campo-texto.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampoTexto {
  readonly etiqueta = input.required<string>();
  readonly tipo = input<'text' | 'password'>('text');
  readonly marcador = input('');
  readonly longitudMaxima = input(100);
  readonly autoenfocar = input(false);
  readonly autocompletar = input('off');
  /** Ícono de Phosphor a la izquierda del campo (p. ej. "user", "lock-simple"). */
  readonly icono = input<string | null>(null);
  /** Campo más alto y con etiqueta más legible, para formularios principales como el login. */
  readonly grande = input(false);
  readonly deshabilitado = input(false);
  readonly error = input<string | null>(null);
  readonly valor = model('');
  readonly enviar = output<void>();
  readonly desenfocar = output<void>();

  protected readonly idError = `campo-error-${++contador}`;
  protected readonly verTexto = signal(false);
  protected readonly mayusculas = signal(false);

  protected readonly tipoEfectivo = computed(() =>
    this.tipo() === 'password' && this.verTexto() ? 'text' : this.tipo()
  );

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  constructor() {
    afterNextRender(() => {
      if (this.autoenfocar()) this.enfocar();
    });
  }

  enfocar(): void {
    this.control()?.nativeElement.focus();
  }

  protected escribir(evento: Event): void {
    this.valor.set((evento.target as HTMLInputElement).value);
  }

  protected alTeclear(evento: KeyboardEvent): void {
    if (this.tipo() === 'password') {
      this.mayusculas.set(evento.getModifierState('CapsLock'));
    }
  }

  protected alDesenfocar(): void {
    this.mayusculas.set(false);
    this.desenfocar.emit();
  }

  protected alternarVisibilidad(): void {
    this.verTexto.update((visible) => !visible);
  }
}
