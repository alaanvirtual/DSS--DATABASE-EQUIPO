import { ArrastreIdea } from '../models/idea';

const TIPO_MIME = 'application/x-dss-idea';

export function guardarArrastre(transferencia: DataTransfer, arrastre: ArrastreIdea): void {
  transferencia.setData(TIPO_MIME, JSON.stringify(arrastre));
  transferencia.effectAllowed = 'move';
}

export function leerArrastre(transferencia: DataTransfer | null): ArrastreIdea | null {
  const crudo = transferencia?.getData(TIPO_MIME);
  if (!crudo) return null;

  try {
    return JSON.parse(crudo) as ArrastreIdea;
  } catch {
    return null;
  }
}
