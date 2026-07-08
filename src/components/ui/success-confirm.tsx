'use client';

import * as React from 'react';
import { SuccessOverlay } from '@/components/ui/SuccessOverlay';

/**
 * SuccessConfirmProvider / useSuccessConfirm (UX-18) — confirmación de éxito
 * centrada única para toda la app. Reemplaza el toast de esquina para TODAS
 * las confirmaciones de acciones (crear/editar/eliminar/quitar/restaurar/
 * resolver/descartar/vista, etc.) por el overlay centrado y animado
 * (SuccessOverlay, UX-14). El toast (`notify`, lib/toast.tsx) sigue existiendo
 * solo para error/info — nunca para success.
 *
 *   const confirmSuccess = useSuccessConfirm();
 *   confirmSuccess('Obra social eliminada');
 *   confirmSuccess('Afiliado creado', 'Pérez, Juan · 2 adherentes', {
 *     onDone: () => router.push(`/dashboard/afiliados/${id}`),
 *   });
 *
 * Cola simple (no hace falta encolar/apilar): si llega una confirmación
 * mientras hay otra visible, la reemplaza. El `key` incremental fuerza un
 * remount de SuccessOverlay para que el hold (~1.4s, o ~950ms con
 * prefers-reduced-motion) arranque de cero con el mensaje nuevo en vez de
 * heredar el timer ya en curso del anterior.
 */

interface SuccessConfirmOptions {
  /** Corre cuando termina el hold y el overlay se oculta — típicamente para navegar. */
  onDone?: () => void;
}

type SuccessConfirmFn = (title: string, subtitle?: string, opts?: SuccessConfirmOptions) => void;

const SuccessConfirmContext = React.createContext<SuccessConfirmFn | null>(null);

interface SuccessConfirmState {
  id: number;
  title: string;
  subtitle?: string;
  onDone?: () => void;
}

export function SuccessConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SuccessConfirmState | null>(null);
  const idRef = React.useRef(0);

  const confirmSuccess = React.useCallback<SuccessConfirmFn>((title, subtitle, opts) => {
    idRef.current += 1;
    setState({ id: idRef.current, title, subtitle, onDone: opts?.onDone });
  }, []);

  const handleDone = () => {
    state?.onDone?.();
    setState(null);
  };

  return (
    <SuccessConfirmContext.Provider value={confirmSuccess}>
      {children}
      {state && (
        <SuccessOverlay key={state.id} show title={state.title} subtitle={state.subtitle} onDone={handleDone} />
      )}
    </SuccessConfirmContext.Provider>
  );
}

export function useSuccessConfirm(): SuccessConfirmFn {
  const ctx = React.useContext(SuccessConfirmContext);
  if (!ctx) {
    throw new Error('useSuccessConfirm debe usarse dentro de <SuccessConfirmProvider>.');
  }
  return ctx;
}
