'use client';

interface DigitCounterProps {
  /** Valor actual del campo (se usa su longitud, no el contenido). */
  value: string;
  /** Máximo de dígitos esperado (ej. 8 para DNI, 11 para CUIL/CUIT, 13 para teléfono). */
  max: number;
  /**
   * Mínimo de dígitos para considerar el campo "completo/OK" (ej. DNI acepta
   * 7 u 8 — el verde se activa desde 7, no solo en el tope). Default = max
   * (solo se pone OK al llegar exactamente al máximo).
   */
  min?: number;
  /** Si el campo tiene un error activo (fieldErrors[campo]), el contador se pinta en rojo. */
  hasError?: boolean;
}

/**
 * UX-11 — contador de dígitos en vivo (`n/max`) para campos con máscara
 * numérica (DNI, CUIL, CUIT, teléfono/celular). Se ubica bajo el input, a la
 * DERECHA, en un contenedor flex junto al mensaje de error (que va a la
 * izquierda) — ambos coexisten sin pisarse (ver `Field` de cada form).
 *
 * Color: gris sutil mientras se está cargando (longitud entre 1 y min-1),
 * verde suave cuando la longitud ya es válida (>= min y <= max), rojo suave
 * si el campo tiene un error activo. En 0 (campo vacío) también gris sutil.
 */
export default function DigitCounter({ value, max, min, hasError }: DigitCounterProps) {
  const count = value.length;
  const minValid = min ?? max;
  const isValid = count >= minValid && count <= max;

  const colorClass = hasError
    ? 'text-[var(--sev-critica-fg)]'
    : isValid
      ? 'text-[var(--sev-baja-fg)]'
      : 'text-[var(--fg-subtle)]';

  return (
    <span className={`shrink-0 text-xs tabular-nums ${colorClass}`} aria-hidden="true">
      {count}/{max}
    </span>
  );
}
