/**
 * frequency.ts — contador simple en localStorage para "valores frecuentes"
 * (UX-3.3). Regla madre: esto SOLO ordena/sugiere, nunca autocompleta — el
 * consumidor decide qué hacer con el orden/sugerencia (chip con click explícito).
 *
 * Claves por userId para no mezclar el historial de distintos operadores en el
 * mismo navegador.
 */

type FrequencyMap = Record<string, number>;

function storageKey(namespace: string, userId: string): string {
  return `freq:${namespace}:${userId}`;
}

function readMap(namespace: string, userId: string): FrequencyMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(namespace, userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(namespace: string, userId: string, map: FrequencyMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(namespace, userId), JSON.stringify(map));
  } catch {
    /* localStorage no disponible: ignorar */
  }
}

/** Suma 1 al contador de `value` dentro de `namespace` para `userId`. */
export function bumpFrequency(namespace: string, userId: string, value: string): void {
  if (!value) return;
  const map = readMap(namespace, userId);
  map[value] = (map[value] ?? 0) + 1;
  writeMap(namespace, userId, map);
}

/**
 * Ordena `items` por frecuencia de uso descendente (los no usados quedan al
 * final, en su orden original). `getKey` extrae la clave de frecuencia de
 * cada item (ej. el id de la obra social).
 */
export function sortByFrequency<T>(
  items: T[],
  namespace: string,
  userId: string,
  getKey: (item: T) => string
): T[] {
  const map = readMap(namespace, userId);
  return [...items].sort((a, b) => {
    const fa = map[getKey(a)] ?? 0;
    const fb = map[getKey(b)] ?? 0;
    return fb - fa;
  });
}

/** Namespace fijo: última localidad/provincia usadas por el operador (chip sugerido). */
const LAST_LOCATION_NS = 'ultima-ubicacion';

export interface LastLocation {
  localidad?: string;
  provincia?: string;
}

/** Guarda la última localidad/provincia usadas por este usuario (para el chip sugerido). */
export function saveLastLocation(userId: string, location: LastLocation): void {
  if (typeof window === 'undefined') return;
  if (!location.localidad && !location.provincia) return;
  try {
    window.localStorage.setItem(
      `${LAST_LOCATION_NS}:${userId}`,
      JSON.stringify(location)
    );
  } catch {
    /* localStorage no disponible: ignorar */
  }
}

/** Lee la última localidad/provincia usadas por este usuario, o null si no hay. */
export function getLastLocation(userId: string): LastLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${LAST_LOCATION_NS}:${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Namespace usado para la frecuencia de obras sociales elegidas en afiliaciones. */
export const OBRA_SOCIAL_FREQUENCY_NS = 'obra-social';
