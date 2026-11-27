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

/**
 * Área de texto multilínea con etiqueta y contador de caracteres.
 * Enlace bidireccional: [(valor)]="señal". Ctrl+Enter (o Cmd+Enter) emite `enviar`.
 */
@Component({
  selector: 'app-campo-area',
  templateUrl: './campo-area.html',
  styleUrl: './campo-area.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampoArea {
  readonly etiqueta = input.required<string>();
  readonly marcador = input('');
  readonly filas = input(4);
  readonly longitudMaxima = input(1000);
  readonly autoenfocar = input(false);
  readonly valor = model('');
  readonly enviar = output<void>();

  private readonly control = viewChild<ElementRef<HTMLTextAreaElement>>('control');

  constructor() {
    afterNextRender(() => {
      if (this.autoenfocar()) this.control()?.nativeElement.focus();
    });
  }

  protected escribir(evento: Event): void {
    this.valor.set((evento.target as HTMLTextAreaElement).value);
  }

  protected alTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
      evento.preventDefault();
      this.enviar.emit();
    }
  }
}
