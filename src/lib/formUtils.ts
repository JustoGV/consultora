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
