/**
 * Chart theme (UX-8d) — paleta y estilos de Recharts derivados de los tokens.
 *
 * Los gráficos NO usan el azul/rojo default de la librería. Las series
 * categóricas salen de la rampa teal de marca (`--primary-*`) + neutrales; el
 * semáforo (rojo/ámbar/verde) queda reservado a severidad (RN-11) y solo se usa
 * cuando el dato ES una severidad (vigente/vencido, etc.). Mismo criterio que
 * /dashboard/reportes.
 */

/** Estilo de los ticks de ejes (sutil, tipografía chica). */
export const CHART_TICK = { fontSize: 11, fill: "var(--fg-muted)" } as const;

/** Color de la grilla cartesiana (hairline). */
export const CHART_GRID = "var(--border)";

/** Estilo del tooltip: superficie clara, borde crisp, radio y sombra de token. */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-md)",
  fontSize: "13px",
  color: "var(--fg)",
} as const;

export const CHART_TOOLTIP_LABEL_STYLE = {
  color: "var(--fg)",
  fontWeight: 600,
  marginBottom: 2,
} as const;

export const CHART_TOOLTIP_ITEM_STYLE = { color: "var(--fg-muted)" } as const;

/**
 * Paleta categórica derivada de la rampa teal. Ordenada de más oscura a más
 * clara para que las categorías se distingan sin recurrir a colores de librería.
 */
export const CHART_CATEGORICAL = [
  "var(--primary-600)",
  "var(--primary-400)",
  "var(--primary-800)",
  "var(--primary-300)",
  "var(--primary-500)",
  "var(--neutral-400)",
] as const;

/** Color de serie primaria (barras/líneas de una sola serie). */
export const CHART_PRIMARY = "var(--primary-600)";
export const CHART_PRIMARY_SOFT = "var(--primary-300)";

/** Duración de la animación de entrada de las series (breve, no adorno). */
export const CHART_ANIM_MS = 600;
