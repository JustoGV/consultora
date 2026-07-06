/**
 * "Hace cuánto" en español, compacto (para la bandeja de alertas).
 * Ej: "hace 5 min", "hace 2 h", "hace 3 días".
 */
export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const then = typeof iso === "string" ? new Date(iso) : iso;
  const ms = Date.now() - then.getTime();
  if (Number.isNaN(ms)) return "";

  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "recién";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}
