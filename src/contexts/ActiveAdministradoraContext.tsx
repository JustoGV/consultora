'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Administradora } from '@/types';
import { administradoraService } from '@/services/administradoraService';

const STORAGE_NS = 'activeAdministradoraId';

function storageKey(userId: string): string {
  return `${STORAGE_NS}:${userId}`;
}

function readStored(userId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

function writeStored(userId: string, administradoraId: string): void {
  try {
    window.localStorage.setItem(storageKey(userId), administradoraId);
  } catch {
    /* localStorage no disponible: ignorar */
  }
}

interface ActiveAdministradoraContextType {
  /** Administradora activa elegida por el SUPERADMIN (null si aún no se cargó ninguna). */
  activeAdministradoraId: string | null;
  /** Cambia la administradora activa y la persiste en localStorage (clave por userId). */
  setActiveAdministradoraId: (id: string) => void;
  /** Catálogo completo de administradoras, para poblar el selector. */
  administradoras: Administradora[];
  /** true mientras se resuelve la carga inicial (catálogo + valor guardado/por defecto). */
  loading: boolean;
}

const ActiveAdministradoraContext = createContext<ActiveAdministradoraContextType | undefined>(
  undefined
);

/**
 * ActiveAdministradoraProvider (UX-15a) — resuelve el "tenant de trabajo" para
 * un usuario SUPERADMIN, que no tiene `administradoraId` propio (opera sobre
 * todas). Sin esto, los formularios de catálogo/standalone (tipo-discapacidad,
 * servicios-no-nomenclados, efectores, prestadores, nomencladores, obras
 * sociales, estado-civil, profesionales) no tienen ningún administradoraId
 * para mandar en el DTO y el backend responde 400 "El ID de administradora es
 * requerido" — o, peor, el form los obligaba a tipear un UUID a mano.
 *
 * Para usuarios ADMIN/USER este provider es un no-op: `administradoras` no se
 * carga y `activeAdministradoraId` queda null — usar siempre `user.administradoraId`
 * en ese caso (ver `useActiveAdministradoraId`, que ya hace esa resolución).
 *
 * Persistencia: localStorage con clave por userId (`activeAdministradoraId:<userId>`),
 * para no pisar la preferencia de otro superadmin que use el mismo navegador.
 */
export function ActiveAdministradoraProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin } = useAuth();
  const [administradoras, setAdministradoras] = useState<Administradora[]>([]);
  const [activeAdministradoraId, setActiveAdministradoraIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;

    if (!isSuperAdmin || !userId) {
      // Defer to the next tick (not synchronous in the effect body) — same
      // pattern as dashboard/layout.tsx's `mounted` flag, avoids the
      // cascading-render lint (react-hooks/set-state-in-effect).
      const t = setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    administradoraService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setAdministradoras(data);

        const stored = readStored(userId);
        const storedIsValid = stored && data.some((a) => a.id === stored);
        if (storedIsValid) {
          setActiveAdministradoraIdState(stored);
        } else if (data.length > 0) {
          // Sin valor guardado (o ya no existe): default a la primera activa.
          const primera = data.find((a) => a.activo) ?? data[0];
          setActiveAdministradoraIdState(primera.id);
          writeStored(userId, primera.id);
        }
      })
      .catch(() => {
        if (!cancelled) setAdministradoras([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, userId]);

  const setActiveAdministradoraId = useCallback(
    (id: string) => {
      setActiveAdministradoraIdState(id);
      if (userId) writeStored(userId, id);
    },
    [userId]
  );

  return (
    <ActiveAdministradoraContext.Provider
      value={{ activeAdministradoraId, setActiveAdministradoraId, administradoras, loading }}
    >
      {children}
    </ActiveAdministradoraContext.Provider>
  );
}

function useActiveAdministradoraContext(): ActiveAdministradoraContextType {
  const ctx = useContext(ActiveAdministradoraContext);
  if (ctx === undefined) {
    throw new Error(
      'useActiveAdministradoraId/useActiveAdministradora must be used within an ActiveAdministradoraProvider'
    );
  }
  return ctx;
}

/**
 * Resuelve el administradoraId a usar en los formularios standalone:
 * - ADMIN/USER: siempre el propio (`user.administradoraId`) — sin cambios de comportamiento.
 * - SUPERADMIN: la administradora activa elegida en la Topbar.
 *
 * Devuelve '' si todavía no hay ninguna resuelta (loading, o sin administradoras
 * cargadas) — los formularios deben tratar '' igual que hoy tratan la ausencia
 * de `user.administradoraId` (mensaje "Seleccioná una administradora activa").
 */
export function useActiveAdministradoraId(): string {
  const { user } = useAuth();
  const { activeAdministradoraId } = useActiveAdministradoraContext();
  return user?.administradoraId || activeAdministradoraId || '';
}

/** Acceso completo al contexto (lista + setter + loading), para el selector de la Topbar. */
export function useActiveAdministradora() {
  return useActiveAdministradoraContext();
}
