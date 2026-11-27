import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  model,
  output,
  viewChild
} from '@angular/core';

/** Campo de texto con etiqueta. Enlace bidireccional: [(valor)]="señal". Enter emite `enviar`. */
@Component({
  selector: 'app-campo-texto',
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
  readonly valor = model('');
  readonly enviar = output<void>();

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  constructor() {
    afterNextRender(() => {
      if (this.autoenfocar()) this.control()?.nativeElement.focus();
    });
  }

  protected escribir(evento: Event): void {
    this.valor.set((evento.target as HTMLInputElement).value);
  }
}
