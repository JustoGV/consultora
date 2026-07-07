import { useCallback, useEffect, useRef } from 'react';
import { handleEnterAsTab, isAnyDropdownOpen } from '@/lib/formUtils';

const FOCUSABLE_SELECTOR = 'input, select, [tabindex]';

/** Mismo criterio de "focusable visible" que usa `handleEnterAsTab` (formUtils.ts). */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('tabindex') === '-1') return false;
    if (el.offsetParent === null && el.getClientRects().length === 0) return false;
    return true;
  });
}

interface UseFormKeyboardOptions {
  /** Ref al `<form>` (o contenedor) del modal. */
  formRef: React.RefObject<HTMLElement | null>;
  /** Se dispara con Ctrl+Enter (o Cmd+Enter en Mac). Normalmente el mismo submit del form. */
  onSubmit: () => void;
  /** Se dispara con Esc (después de confirmar si `isDirty`). */
  onClose: () => void;
  /** Si hay cambios sin guardar: Esc pide confirmación antes de cerrar. */
  isDirty: boolean;
  /** Autofocus del primer campo focusable al montar. Default true. */
  autofocus?: boolean;
}

/**
 * useFormKeyboard — kit de teclado para formularios modales (UX-2):
 *
 * - Enter en un input mueve el foco al siguiente campo (reusa `handleEnterAsTab`
 *   de `src/lib/formUtils.ts` tal cual, no reimplementa la lógica).
 * - Ctrl+Enter / Cmd+Enter dispara `onSubmit`.
 * - Esc cierra el form: si `isDirty` pide confirmación con `window.confirm`
 *   antes de llamar `onClose` (alcance aceptado para este ítem: no hay modal de
 *   confirmación custom); si no hay cambios, cierra directo.
 * - Autofocus del primer campo focusable visible al montar (mismo criterio de
 *   selector que `handleEnterAsTab`).
 *
 * Uso con overlay hecho a mano (`<div>` propio + `<form onKeyDown={...}>`):
 * ```tsx
 * const { onKeyDown, focusFirstError } = useFormKeyboard({ formRef, onSubmit: handleSubmit, onClose, isDirty });
 * <form ref={formRef} onKeyDown={onKeyDown} onSubmit={handleSubmit}>...</form>
 * ```
 *
 * Uso dentro de un `Dialog` de Radix (`src/components/ui/dialog.tsx`): Radix
 * intercepta Esc de forma nativa vía `onOpenChange` ANTES de que llegue a burbujear
 * al `onKeyDown` del form, así que hay que conectar el mismo criterio de "Esc"
 * también en `onEscapeKeyDown` de `DialogContent`:
 * ```tsx
 * const { onKeyDown, handleEscape, focusFirstError } = useFormKeyboard({ formRef, onSubmit, onClose, isDirty });
 * <DialogContent onEscapeKeyDown={(e) => { e.preventDefault(); handleEscape(); }}>
 *   <form ref={formRef} onKeyDown={onKeyDown}>...</form>
 * </DialogContent>
 * ```
 */
export function useFormKeyboard({
  formRef,
  onSubmit,
  onClose,
  isDirty,
  autofocus = true,
}: UseFormKeyboardOptions) {
  // Refs para no re-crear los handlers cuando cambian los callbacks/isDirty
  // (evita reinstalar listeners de teclado en cada render).
  const onSubmitRef = useRef(onSubmit);
  const onCloseRef = useRef(onClose);
  const isDirtyRef = useRef(isDirty);
  onSubmitRef.current = onSubmit;
  onCloseRef.current = onClose;
  isDirtyRef.current = isDirty;

  const handleEscape = useCallback(() => {
    // UX-11 — si hay un dropdown de SearchableSelect/Remote abierto, ESE Escape
    // ya lo consumió el propio dropdown (cierra solo el dropdown, deja el foco
    // en su trigger): el modal NO debe cerrarse en la misma pulsación. Ver
    // `isAnyDropdownOpen` en formUtils.ts para el porqué (Radix intercepta
    // Escape en captura sobre `document`, antes de que el dropdown pueda
    // frenarlo con preventDefault/stopPropagation propio).
    if (isAnyDropdownOpen()) return;
    if (isDirtyRef.current) {
      const confirmed = window.confirm('Hay cambios sin guardar. ¿Cerrar de todos modos?');
      if (!confirmed) return;
    }
    onCloseRef.current();
  }, []);

  // Autofocus del primer campo al montar.
  useEffect(() => {
    if (!autofocus) return;
    const container = formRef.current;
    if (!container) return;
    const [first] = getFocusableElements(container);
    first?.focus();
    // Solo al montar (autofocus inicial, no en cada cambio de formRef/autofocus).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Enter / Cmd+Enter = submit, sin importar el target.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onSubmitRef.current();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleEscape();
        return;
      }

      // Enter normal en un input = siguiente campo (delega en formUtils, no
      // reimplementa). Requiere un KeyboardEvent<HTMLFormElement> — el uso
      // esperado es adjuntar este onKeyDown al propio <form>.
      handleEnterAsTab(e as React.KeyboardEvent<HTMLFormElement>);
    },
    [handleEscape]
  );

  /**
   * Busca en el form un input cuyo atributo `name` coincida con la PRIMERA key
   * de `fieldErrors` y le hace focus.
   *
   * Requiere que el consumidor ponga `name={campo}` en cada input — algunos
   * forms del repo controlan todo por state de React SIN atributo `name`; en
   * esos casos esta función no encuentra nada y no hace foco (no lanza error,
   * es un no-op silencioso). Es responsabilidad del componente consumidor
   * agregar `name` si quiere esta feature.
   */
  const focusFirstError = useCallback(
    (fieldErrors: Record<string, string>) => {
      const container = formRef.current;
      if (!container) return;
      const [firstField] = Object.keys(fieldErrors);
      if (!firstField) return;
      const el = container.querySelector<HTMLElement>(`[name="${firstField}"]`);
      el?.focus();
    },
    [formRef]
  );

  return { onKeyDown, handleEscape, focusFirstError };
}
