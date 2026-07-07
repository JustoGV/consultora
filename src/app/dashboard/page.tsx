'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  FileText,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { alertasService } from '@/services/alertasService';
import { personasService } from '@/services/personasService';
import { afiliacionesService } from '@/services/afiliacionesService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { timeAgo } from '@/lib/timeAgo';
import { cn } from '@/lib/utils';
import type { Alerta, DashboardAlertas } from '@/types';

/** Días restantes hasta la fecha objetivo de una alerta (código 30 = vencimiento de certificado). */
function diasRestantes(fechaObjetivo: string | null): number | null {
  if (!fechaObjetivo) return null;
  const ms = new Date(fechaObjetivo).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

const formatFecha = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
};

interface OperativoCounts {
  personas: number | null;
  afiliaciones: number | null;
  certificados: number | null;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardAlertas | null>(null);
  const [vencePronto, setVencePronto] = useState<Alerta[]>([]);
  const [pendientesAntiguas, setPendientesAntiguas] = useState<Alerta[]>([]);
  const [operativo, setOperativo] = useState<OperativoCounts>({
    personas: null,
    afiliaciones: null,
    certificados: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, venceProntoData, pendientesData] = await Promise.all([
        alertasService.getDashboard(),
        // Código 30 = certificado vence en ≤30 días (ver 05-ux-spec.md UX-5.2).
        alertasService.getAlertas({ estado: 'PENDIENTE', codigoNumerico: 30 }),
        alertasService.getAlertas({ estado: 'PENDIENTE' }),
      ]);
      setDashboard(dashboardData);
      setVencePronto(
        [...venceProntoData]
          .sort((a, b) => (diasRestantes(a.fechaObjetivo) ?? Infinity) - (diasRestantes(b.fechaObjetivo) ?? Infinity))
          .slice(0, 6)
      );
      setPendientesAntiguas(
        [...pendientesData]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(0, 5)
      );
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cargar la información del día'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Mini-panel operativo: contadores secos vía getPaginated({limit:1}).total (sin gráficos).
  useEffect(() => {
    personasService
      .getPaginated({ limit: 1 })
      .then((r) => setOperativo((prev) => ({ ...prev, personas: r.total })))
      .catch(() => setOperativo((prev) => ({ ...prev, personas: null })));
    afiliacionesService
      .getPaginated({ limit: 1 })
      .then((r) => setOperativo((prev) => ({ ...prev, afiliaciones: r.total })))
      .catch(() => setOperativo((prev) => ({ ...prev, afiliaciones: null })));
    certificadosDiscapacidadService
      .getPaginated({ limit: 1 })
      .then((r) => setOperativo((prev) => ({ ...prev, certificados: r.total })))
      .catch(() => setOperativo((prev) => ({ ...prev, certificados: null })));
  }, []);

  const criticas = (dashboard?.porPrioridad.critica ?? 0) + (dashboard?.porPrioridad.alta ?? 0);
  const media = dashboard?.porPrioridad.media ?? 0;
  const info = (dashboard?.porPrioridad.baja ?? 0) + (dashboard?.porPrioridad.info ?? 0);

  const focusSearch = () => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Buscar paciente"]');
    if (input) {
      input.focus();
      return;
    }
    router.push('/dashboard/pacientes');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--fg)]">
            Hola, {user?.nombre?.split(' ')[0] ?? ''}
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">Lo urgente del día.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[var(--sev-critica-bg)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
          {error}
        </div>
      )}

      {/* 1. Franja semáforo (hero) — 3 tarjetas grandes clickeables */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SemaforoCard
          tone="critica"
          label="Críticas"
          count={criticas}
          loading={loading}
          href="/dashboard/alerts?semaforo=critica"
        />
        <SemaforoCard
          tone="media"
          label="Media"
          count={media}
          loading={loading}
          href="/dashboard/alerts?semaforo=media"
        />
        <SemaforoCard
          tone="baja"
          label="Info"
          count={info}
          loading={loading}
          href="/dashboard/alerts?semaforo=baja"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 2. Vence pronto — alertas código 30 (certificados ≤30 días), PENDIENTE */}
        <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <CalendarClock className="size-4 text-[var(--sev-critica-fg)]" />
            <h2 className="text-sm font-semibold text-[var(--fg)]">Vence pronto</h2>
            <span className="ml-auto text-xs text-[var(--fg-subtle)]">Certificados ≤30 días</span>
          </header>
          <div className="flex-1">
            {loading ? (
              <SkeletonList rows={4} />
            ) : vencePronto.length === 0 ? (
              <EmptyRow text="Sin certificados por vencer en los próximos 30 días." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {vencePronto.map((a) => {
                  const dias = diasRestantes(a.fechaObjetivo);
                  return (
                    <li key={a.id} className="px-4 py-2.5">
                      <Link
                        href={a.personaId ? `/dashboard/pacientes/${a.personaId}` : '/dashboard/alerts'}
                        className="flex items-center justify-between gap-3 hover:text-[var(--primary-700)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--fg)]">
                            {a.persona ? `${a.persona.apellido}, ${a.persona.nombre}` : a.titulo}
                          </p>
                          <p className="truncate text-xs text-[var(--fg-muted)]">{a.titulo}</p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold tabular-nums',
                            dias !== null && dias <= 7
                              ? 'bg-[var(--sev-critica-bg)] text-[var(--sev-critica-fg)]'
                              : 'bg-[var(--sev-media-bg)] text-[var(--sev-media-fg)]'
                          )}
                        >
                          {dias !== null ? `${dias}d` : formatFecha(a.fechaObjetivo)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* 3. Pendientes más antiguas */}
        <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <Clock className="size-4 text-[var(--fg-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--fg)]">Pendientes más antiguas</h2>
            <Link
              href="/dashboard/alerts"
              className="ml-auto text-xs font-medium text-[var(--primary-700)] hover:underline"
            >
              Ver todas
            </Link>
          </header>
          <div className="flex-1">
            {loading ? (
              <SkeletonList rows={4} />
            ) : pendientesAntiguas.length === 0 ? (
              <EmptyRow text="No hay alertas pendientes sin atender." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {pendientesAntiguas.map((a) => (
                  <li key={a.id} className="px-4 py-2.5">
                    <Link
                      href={a.personaId ? `/dashboard/pacientes/${a.personaId}` : '/dashboard/alerts'}
                      className="flex items-center justify-between gap-3 hover:text-[var(--primary-700)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--fg)]">{a.titulo}</p>
                        <p className="truncate text-xs text-[var(--fg-muted)]">
                          {a.persona ? `${a.persona.apellido}, ${a.persona.nombre}` : 'Sin paciente asociado'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--fg-subtle)]">
                        {timeAgo(a.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* 4. Mini-panel operativo — contadores secos, sin gráficos */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-5 py-3.5">
        <OperativoStat icon={Users} label="Pacientes activos" value={operativo.personas} />
        <OperativoStat icon={FileText} label="Afiliaciones" value={operativo.afiliaciones} />
        <OperativoStat icon={AlertTriangle} label="Certificados" value={operativo.certificados} />
      </section>

      {/* 5. Accesos rápidos */}
      <section className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <>
            <Link
              href="/dashboard/pacientes"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <UserPlus className="size-4" />
              Nuevo paciente
            </Link>
            <button
              type="button"
              onClick={focusSearch}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <Search className="size-4" />
              Buscar
            </button>
            <Link
              href="/dashboard/certificados-discapacidad"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <FileText className="size-4" />
              Cargar certificado
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/dashboard/certificados-discapacidad"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <FileText className="size-4" />
              Mis certificados
            </Link>
            <button
              type="button"
              onClick={focusSearch}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--surface-sunken)]"
            >
              <Search className="size-4" />
              Buscar paciente
            </button>
          </>
        )}
      </section>
    </div>
  );
}

/** Tarjeta grande del hero de semáforo (RN-11) — clickeable, filtra /dashboard/alerts. */
function SemaforoCard({
  tone,
  label,
  count,
  loading,
  href,
}: {
  tone: 'critica' | 'media' | 'baja';
  label: string;
  count: number;
  loading: boolean;
  href: string;
}) {
  const toneStyles = {
    critica: {
      bg: 'var(--sev-critica-bg)',
      fg: 'var(--sev-critica-fg)',
      solid: 'var(--sev-critica)',
    },
    media: {
      bg: 'var(--sev-media-bg)',
      fg: 'var(--sev-media-fg)',
      solid: 'var(--sev-media)',
    },
    baja: {
      bg: 'var(--sev-baja-bg)',
      fg: 'var(--sev-baja-fg)',
      solid: 'var(--sev-baja)',
    },
  }[tone];

  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      <div>
        <p className="text-sm font-medium text-[var(--fg-muted)]">{label}</p>
        <p
          className="mt-1 text-4xl font-semibold tabular-nums"
          style={{ color: toneStyles.fg }}
        >
          {loading ? <span className="skeleton inline-block h-9 w-12 rounded" /> : count}
        </p>
      </div>
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: toneStyles.bg }}
      >
        <span className="size-3 rounded-full" style={{ backgroundColor: toneStyles.solid }} aria-hidden />
      </span>
    </Link>
  );
}

function OperativoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 text-[var(--fg-subtle)]" />
      <div className="leading-tight">
        <p className="text-lg font-semibold tabular-nums text-[var(--fg)]">
          {value === null ? <span className="skeleton inline-block h-5 w-8 rounded" /> : value}
        </p>
        <p className="text-xs text-[var(--fg-muted)]">{label}</p>
      </div>
    </div>
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <ul className="divide-y divide-[var(--border)]">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center justify-between px-4 py-2.5">
          <span className="skeleton block h-3.5 w-2/3 rounded" style={{ opacity: 1 - i * 0.08 }} />
          <span className="skeleton block h-3.5 w-8 rounded" style={{ opacity: 1 - i * 0.08 }} />
        </li>
      ))}
    </ul>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <p className="text-sm text-[var(--fg-muted)]">{text}</p>
    </div>
  );
}
