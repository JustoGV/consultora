import { useCallback, useRef, useState } from 'react';

const SAVED_BANNER_MS = 2000;
const FOCUSABLE_SELECTOR = 'input, select, [tabindex]';

function focusFirstField(container: HTMLElement | null) {
  if (!container) return;
  const first = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).find((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('tabindex') === '-1') return false;
    if (el.offsetParent === null && el.getClientRects().length === 0) return false;
    return true;
  });
  first?.focus();
}

interface UseContinuousCreateOptions {
  /** Estado inicial del toggle "seguir cargando". Default true (pensado para abrirse desde un listado). */
  defaultContinuous?: boolean;
  /** Resetea el form a sus valores por defecto. Lo llama el hook tras un create exitoso en modo continuo. */
  onReset: () => void;
  /** Ref al form/contenedor, para devolver el foco al primer campo tras resetear. */
  formRef: React.RefObject<HTMLElement | null>;
  /** Cuánto dura visible el banner "Guardado" antes de auto-ocultarse. Default 2000ms. */
  savedBannerMs?: number;
}

/**
 * useContinuousCreate — modo "seguir cargando" (UX-2): tras un create exitoso,
 * si el toggle está en ON no cierra el modal, resetea el form, muestra un
 * banner breve de confirmación y devuelve el foco al primer campo. Si está en
 * OFF, comportamiento normal: el caller cierra el modal.
 *
 * Uso:
 * ```tsx
 * const { continuous, setContinuous, showSavedBanner, handleCreateSuccess } = useContinuousCreate({
 *   defaultContinuous: true,
 *   onReset: () => setFormData(initialFormData),
 *   formRef,
 * });
 *
 * async function handleSubmit() {
 *   const created = await service.create(payload);
 *   handleCreateSuccess(() => setIsModalOpen(false));
 * }
 * ```
 */
export function useContinuousCreate({
  defaultContinuous = true,
  onReset,
  formRef,
  savedBannerMs = SAVED_BANNER_MS,
}: UseContinuousCreateOptions) {
  const [continuous, setContinuous] = useState(defaultContinuous);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCreateSuccess = useCallback(
    (onCloseIfNotContinuous: () => void) => {
      if (!continuous) {
        onCloseIfNotContinuous();
        return;
      }

      onReset();
      setShowSavedBanner(true);
      focusFirstField(formRef.current);

      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = setTimeout(() => setShowSavedBanner(false), savedBannerMs);
    },
    [continuous, onReset, formRef, savedBannerMs]
  );

  return { continuous, setContinuous, showSavedBanner, handleCreateSuccess };
}
