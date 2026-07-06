import type { PrioridadAlerta } from "@/types";

/**
 * Semáforo de severidad (RN-11) — fuente única de verdad para el mapeo
 * prioridad → color. Debe verse idéntico en campana, bandeja, inicio, tablas
 * y fichas. NUNCA usar rojo/ámbar/verde con otro significado.
 *
 *   CRITICA / ALTA  → rojo   ("critica")
 *   MEDIA           → ámbar  ("media")
 *   BAJA / INFO     → verde  ("baja")
 */
export type SeverityTone = "critica" | "media" | "baja";

/** Orden de severidad de mayor a menor (para calcular el máximo presente). */
const SEVERITY_RANK: Record<SeverityTone, number> = {
  critica: 3,
  media: 2,
  baja: 1,
};

/** Mapea una prioridad de alerta al tono de semáforo (RN-11). */
export function priorityToTone(prioridad: PrioridadAlerta): SeverityTone {
  switch (prioridad) {
    case "CRITICA":
    case "ALTA":
      return "critica";
    case "MEDIA":
      return "media";
    case "BAJA":
    case "INFO":
    default:
      return "baja";
  }
}

/**
 * Dado los contadores por prioridad del dashboard, devuelve el tono de la
 * severidad máxima presente (para colorear el badge de la campana), o null si
 * no hay ninguna alerta con conteo > 0.
 */
export function maxToneFromCounts(counts: {
  critica: number;
  alta: number;
  media: number;
  baja: number;
  info: number;
}): SeverityTone | null {
  if (counts.critica > 0 || counts.alta > 0) return "critica";
  if (counts.media > 0) return "media";
  if (counts.baja > 0 || counts.info > 0) return "baja";
  return null;
}

/** Tono más alto de una lista de prioridades (para agrupar). */
export function maxTone(prioridades: PrioridadAlerta[]): SeverityTone | null {
  let best: SeverityTone | null = null;
  for (const p of prioridades) {
    const tone = priorityToTone(p);
    if (!best || SEVERITY_RANK[tone] > SEVERITY_RANK[best]) best = tone;
  }
  return best;
}

/** Variables CSS del token de un tono (para estilos inline puntuales). */
export const TONE_VARS: Record<
  SeverityTone,
  { solid: string; bg: string; fg: string }
> = {
  critica: {
    solid: "var(--sev-critica)",
    bg: "var(--sev-critica-bg)",
    fg: "var(--sev-critica-fg)",
  },
  media: {
    solid: "var(--sev-media)",
    bg: "var(--sev-media-bg)",
    fg: "var(--sev-media-fg)",
  },
  baja: {
    solid: "var(--sev-baja)",
    bg: "var(--sev-baja-bg)",
    fg: "var(--sev-baja-fg)",
  },
};

/** Etiqueta legible del tono (para tooltips/labels). */
export const TONE_LABEL: Record<SeverityTone, string> = {
  critica: "Crítica / Alta",
  media: "Media",
  baja: "Baja / Info",
};
