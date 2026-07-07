'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Lock, Inbox, Info, BarChart3 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { mockPatients } from '@/lib/mockData';
import { getUserAdministradoraId } from '@/lib/userHelpers';
import { Button } from '@/components/ui/button';

// Lazy-load PatientMetrics: it pulls in recharts (heavy charting lib) and is
// already a client component, so ssr: false is safe here and keeps recharts
// out of the initial bundle. Skeleton estructural mientras compila.
const PatientMetrics = dynamic(() => import('@/components/PatientMetrics'), {
  ssr: false,
  loading: () => <MetricsSkeleton />,
});

export default function MetricsPage() {
  const { user, isSuperAdmin } = useAuth();

  const filteredPatients = useMemo(() => {
    if (!user) return [];
    const administradoraId = getUserAdministradoraId(user);
    if (administradoraId === 'global') return mockPatients;
    return mockPatients.filter((p) => administradoraId && p.administradoras.includes(administradoraId));
  }, [user]);

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--fg-subtle)]">
          <Lock className="size-6" />
        </span>
        <h2 className="text-xl font-semibold text-[var(--fg)]">Acceso restringido</h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--fg-muted)]">
          Solo el superadministrador puede acceder a las métricas detalladas.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — patrón de título del resto del dashboard */}
      <div>
        <h1 className="text-3xl font-semibold text-[var(--fg)]">Métricas</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Análisis de afiliados y certificados
          {user?.administradoraId && user.administradoraId !== 'global'
            ? ' de tu administradora.'
            : ' del sistema completo.'}
        </p>
      </div>

      {filteredPatients.length > 0 ? (
        <PatientMetrics patients={filteredPatients} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
          <span className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--fg-subtle)]">
            <Inbox className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--fg)]">Sin datos disponibles</p>
            <p className="mx-auto max-w-xs text-sm text-[var(--fg-muted)]">
              Aún no hay afiliados registrados para mostrar métricas.
            </p>
          </div>
          <Button asChild className="mt-1">
            <Link href="/dashboard/afiliados">Ver afiliados</Link>
          </Button>
        </div>
      )}

      {/* Nota informativa */}
      <div className="flex items-start gap-3 rounded-lg border border-[var(--primary-200)] bg-[var(--primary-50)] px-5 py-4">
        <Info className="mt-0.5 size-4 shrink-0 text-[var(--primary-700)]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-[var(--primary-900)]">Sobre estas métricas</h3>
          <ul className="mt-1.5 space-y-1 text-sm text-[var(--primary-800)]">
            <li>Se calculan en tiempo real a partir de los datos actuales.</li>
            <li>La distribución por edad se agrupa en rangos para su lectura.</li>
            <li>Los certificados por renovar son aquellos cuya fecha de vencimiento ya pasó.</li>
            <li>Los porcentajes se calculan sobre el total de afiliados o certificados según corresponda.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Skeleton estructural: refleja la forma real (4 KPIs + grilla de charts). */
function MetricsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="space-y-2">
              <span className="skeleton block h-3 w-20 rounded" />
              <span className="skeleton block h-7 w-14 rounded" />
            </div>
            <span className="skeleton size-11 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="skeleton size-8 rounded-md" />
              <div className="space-y-1.5">
                <span className="skeleton block h-3.5 w-40 rounded" />
                <span className="skeleton block h-2.5 w-24 rounded" />
              </div>
            </div>
            <div className="flex h-[240px] items-center justify-center">
              <BarChart3 className="size-8 text-[var(--border-strong)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
