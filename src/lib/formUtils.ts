/**
 * Enter en un input de un formulario NUNCA hace submit: mueve el foco al siguiente
 * campo focusable visible (RN-15). El submit queda reservado al botón explícito.
 *
 * No aplica a TEXTAREA (donde Enter agrega una línea nueva), a BUTTON, ni a
 * inputs type="submit" (donde Enter debe conservar su comportamiento nativo).
 */
export function handleEnterAsTab(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key !== 'Enter') return;

  // Un hijo con su propio manejo de Enter (ej. SearchableSelect navegando opciones
  // de su dropdown) ya llamó preventDefault en la fase de bubbling antes de llegar
  // acá: no le robamos el foco mientras está resolviendo su propia interacción.
  if (e.defaultPrevented) return;

  const target = e.target as HTMLElement;
  if (target.tagName !== 'INPUT') return;

  const inputEl = target as HTMLInputElement;
  if (inputEl.type === 'submit') return;

  e.preventDefault();

  const focusableSelector = 'input, select, [tabindex]';
  const elements = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('tabindex') === '-1') return false;
    // Visible: sin display:none / visibility:hidden y con tamaño en el layout.
    if (el.offsetParent === null && el.getClientRects().length === 0) return false;
    return true;
  });

  const currentIndex = elements.indexOf(target as HTMLInputElement);
  if (currentIndex === -1) return;

  const next = elements[currentIndex + 1];
  if (next) {
    next.focus();
  }
}

/**
 * Convierte una fecha tipeada como 8 dígitos seguidos sin separadores
 * (ddmmaaaa) a `yyyy-mm-dd`, para alimentar el estado que respalda un
 * `<input type="date">`.
 *
 * LIMITACIÓN HONESTA: un `<input type="date">` nativo NO permite tipear 8
 * dígitos corridos de forma directa en todos los navegadores — el widget
 * segmentado del picker (día/mes/año por separado) es el que exponen Chrome,
 * Firefox y Edge, y no hay forma portable de interceptar "el usuario tipeó
 * 8 dígitos seguidos" dentro de ESE widget. Esta función NO resuelve eso.
 *
 * Lo que sí resuelve, de forma verificable: dado un input `type="text"` con
 * patrón numérico (ej. `inputMode="numeric"` + `maxLength={8}`) donde el
 * usuario tipea literalmente "06072026", esta función pura lo convierte a
 * "2026-07-06" para setear el estado que alimenta un `<input type="date">`
 * controlado en paralelo (patrón: input de texto visible + date oculto/sync,
 * o simplemente usar el string resultante como value del date). Es una
 * función pura y testeable, deliberadamente NO atada a ningún tipo de input
 * específico — la integración con el DOM queda a criterio del consumidor.
 *
 * Si `rawValue` no son exactamente 8 dígitos, o no representan una fecha
 * válida (ej. 31 de febrero), devuelve el `rawValue` sin modificar.
 *
 * @example
 * parseDateInput('06072026') // -> '2026-07-06'
 * parseDateInput('31022026') // -> '31022026' (fecha inválida, no se transforma)
 * parseDateInput('2026-07-06') // -> '2026-07-06' (no son 8 dígitos corridos, pasa igual)
 */
export function parseDateInput(rawValue: string): string {
  if (!/^\d{8}$/.test(rawValue)) return rawValue;

  const dd = rawValue.slice(0, 2);
  const mm = rawValue.slice(2, 4);
  const yyyy = rawValue.slice(4, 8);

  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  // Validación básica de fecha real (incluye años bisiestos) usando el
  // comportamiento de normalización de Date: si los componentes no calzan
  // (ej. 31/02), el día "se corre" de mes al reconstruirlo.
  const candidate = new Date(year, month - 1, day);
  const isValid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  if (!isValid) return rawValue;

  return `${yyyy}-${mm}-${dd}`;
}

// ============================================
// UX-3.4 — Validación en vivo (onBlur por campo)
// ============================================
// Marca de error inmediata + mensaje corto; el submit repite todo (defensa
// doble, RN-16). Ninguna de estas funciones bloquea el tipeo: se llaman en
// onBlur, nunca en onChange.

/** DNI: 7 u 8 dígitos numéricos. */
export function isValidDni(value: string): boolean {
  return /^\d{7,8}$/.test(value.trim());
}

/**
 * CUIL: 11 dígitos numéricos + dígito verificador válido (algoritmo estándar
 * módulo 11 usado por ARCA/AFIP: dígitos 1-10 ponderados por 5,4,3,2,7,6,5,4,3,2).
 */
export function isValidCuil(value: string): boolean {
  const digits = value.trim().replace(/[-\s]/g, '');
  if (!/^\d{11}$/.test(digits)) return false;

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const mod = sum % 11;
  const expectedCheckDigit = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;

  return expectedCheckDigit === Number(digits[10]);
}

/** Email: formato básico (el backend valida con @IsEmail; esto es solo el feedback en vivo). */
export function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Fecha de nacimiento: no futura y no mayor a 120 años. `value` en formato
 * `yyyy-mm-dd` (el value nativo de `<input type="date">`).
 */
export function isValidFechaNacimiento(value: string): boolean {
  if (!value) return false;
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return false;

  const hoy = new Date();
  if (fecha > hoy) return false;

  const hace120Anos = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
  if (fecha < hace120Anos) return false;

  return true;
}

// ============================================
// UX-9 — Validación anticipada con formatos argentinos
// ============================================
// Anticiparse a errores antes de crear: onChange filtra lo que NO puede ser
// (letras en un DNI), onBlur avisa lo que SÍ se puede tipear pero está mal
// (CUIL con verificador incorrecto). Ninguna de estas funciones bloquea el
// tipeo por sí sola — sanitizeDigits es la única que filtra caracteres, y
// solo en los campos numéricos donde aplica.

/**
 * Filtra todo lo que no sea dígito y corta a `max` caracteres. Pensada para
 * usarse en `onChange` de campos numéricos (DNI, CUIL/CUIT, teléfono, celular,
 * código postal numérico): el usuario físicamente no puede tipear letras ni
 * exceder la longitud esperada.
 *
 * @example
 * sanitizeDigits('12a3.456-7', 8) // -> '1234567'
 */
export function sanitizeDigits(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

/**
 * DNI argentino: 7 u 8 dígitos. Opcional en la mayoría de los formularios de
 * terceros (efectores/profesionales no siempre piden DNI) — el llamador
 * decide si es requerido; acá solo se valida el formato si hay contenido.
 */
export function validateDniAR(value: string): string | null {
  if (!value.trim()) return null;
  return /^\d{7,8}$/.test(value.trim()) ? null : 'DNI inválido (7 u 8 dígitos)';
}

/**
 * CUIL/CUIT: 11 dígitos + dígito verificador módulo 11 (algoritmo estándar
 * ARCA/AFIP). Unifica `isValidCuil` para reutilizarse tanto en CUIL de
 * personas como en CUIT de profesionales/efectores — el algoritmo es idéntico.
 */
export function validateCuitCuil(value: string): string | null {
  if (!value.trim()) return null;
  return isValidCuil(value) ? null : 'CUIL/CUIT inválido (11 dígitos, verificá el número)';
}

/**
 * Teléfono argentino (fijo o móvil con característica): opcional; si viene,
 * solo dígitos, 6 a 13 dígitos. No exige formato de característica porque
 * varía demasiado entre fijo/móvil/código de área — solo rango razonable de
 * longitud.
 */
export function validateTelefonoAR(value: string): string | null {
  if (!value.trim()) return null;
  const digits = value.trim().replace(/\D/g, '');
  return /^\d{6,13}$/.test(digits) ? null : 'Teléfono inválido (solo números, 6 a 13 dígitos)';
}

/**
 * Código postal argentino: opcional; acepta 4 dígitos (formato clásico) o
 * CPA (1 letra + 4 dígitos + 3 letras, case-insensitive, ej. C1425ABC).
 */
export function validateCodigoPostalAR(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const esClasico = /^\d{4}$/.test(trimmed);
  const esCPA = /^[a-zA-Z]\d{4}[a-zA-Z]{3}$/.test(trimmed);
  return esClasico || esCPA ? null : 'Código postal inválido (4 dígitos o CPA, ej. C1425ABC)';
}

/** Email: opcional; formato básico (el backend valida con @IsEmail). */
export function validateEmailLive(value: string): string | null {
  if (!value.trim()) return null;
  return isValidEmailFormat(value) ? null : 'Email inválido (ej: nombre@dominio.com)';
}

/**
 * Matrícula profesional: requerida, 1-50 caracteres. Las matrículas
 * provinciales varían mucho en formato (numéricas, alfanuméricas, con
 * guiones/barras) — deliberadamente NO se inventa un patrón rígido, solo
 * no-vacío + longitud razonable.
 */
export function validateMatricula(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Requerido';
  if (trimmed.length > 50) return 'Matrícula demasiado larga (máx. 50 caracteres)';
  return null;
}

/**
 * Valida el par fecha de emisión / fecha de vencimiento de un certificado:
 * la emisión no puede ser futura, y si hay vencimiento cargado, debe ser
 * posterior a la emisión. `emision`/`vencimiento` en formato `yyyy-mm-dd`
 * (el value nativo de `<input type="date">`). Devuelve un mensaje único —
 * el llamador decide en qué campo mostrarlo (normalmente vencimiento, salvo
 * que la emisión en sí sea futura).
 */
export function validarFechasCertificadoAR(emision: string, vencimiento: string): string | null {
  if (!emision) return null;
  const fechaEmision = new Date(emision);
  if (Number.isNaN(fechaEmision.getTime())) return null;

  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  if (fechaEmision > hoy) return 'La fecha de emisión no puede ser futura';

  if (vencimiento) {
    const fechaVencimiento = new Date(vencimiento);
    if (!Number.isNaN(fechaVencimiento.getTime()) && fechaVencimiento <= fechaEmision) {
      return 'El vencimiento debe ser posterior a la emisión';
    }
  }
  return null;
}

/**
 * Fábrica de un `onBlur` genérico por campo: recibe un mapa de reglas
 * (field -> validador que devuelve `string | null`) y un setter de
 * fieldErrors, y devuelve una función `(field, value) => void` que setea o
 * limpia el error de ese campo al vuelo. Evita repetir el mismo switch/case
 * de "validar y setFieldErrors" en cada formulario.
 *
 * @example
 * const validateOnBlur = createBlurValidator(
 *   { email: validateEmailLive, telefono: validateTelefonoAR },
 *   setFieldErrors
 * );
 * <Input onBlur={() => validateOnBlur('email', formData.email)} />
 */
export function createBlurValidator<F extends string>(
  rules: Partial<Record<F, (value: string) => string | null>>,
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  return (field: F, value: string) => {
    const rule = rules[field];
    if (!rule) return;
    const message = rule(value);
    setFieldErrors((prev) => {
      if (!message) {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  };
}
