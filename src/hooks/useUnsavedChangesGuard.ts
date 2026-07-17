'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseUnsavedChangesGuardOptions {
  when: boolean;
  confirm: () => Promise<boolean>;
  onNavigate: (href: string) => void;
}

/**
 * useUnsavedChangesGuard — intercepta la salida de un formulario con cambios
 * sin guardar (`when=true`): F5/cierre de pestaña vía `beforeunload`, y clicks
 * en anchors internos (ej. los links del Sidebar) capturados a nivel
 * `document` antes de que Next.js navegue. Expone `guardedNavigate` para
 * aplicar la misma confirmación desde botones propios del form.
 */
export function useUnsavedChangesGuard({ when, confirm, onNavigate }: UseUnsavedChangesGuardOptions) {
  const whenRef = useRef(when);
  const confirmRef = useRef(confirm);
  const onNavigateRef = useRef(onNavigate);
  whenRef.current = when;
  confirmRef.current = confirm;
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!whenRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!whenRef.current) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      if (anchor.target === '_blank') return;
      e.preventDefault();
      e.stopPropagation();
      confirmRef.current().then((accepted) => {
        if (accepted) onNavigateRef.current(href);
      });
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const guardedNavigate = useCallback(async (href: string) => {
    if (whenRef.current) {
      const accepted = await confirmRef.current();
      if (!accepted) return;
    }
    onNavigateRef.current(href);
  }, []);

  return { guardedNavigate };
}
