'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { alertasService } from '@/services/alertasService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { timeAgo } from '@/lib/timeAgo';
import { notify } from '@/lib/toast';
import { priorityToTone, TONE_VARS, type SeverityTone } from '@/lib/severity';
import { cn } from '@/lib/utils';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertDetailSheet } from '@/components/alerts/AlertDetailSheet';
import Pagination from '@/components/Pagination';
import SearchableSelect from '@/components/SearchableSelect';
import type { Alerta, DashboardAlertas, EstadoAlerta, PrioridadAlerta } from '@/types';

const DEBOUNCE_MS = 300;

/** Filtro de semáforo (chip). "TODAS" no filtra por prioridad. */
type SemaforoFiltro = 'TODAS' | SeverityTone;

const SEMAFORO_CHIPS: { value: SemaforoFiltro; label: string }[] = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'critica', label: 'Rojas' },
  { value: 'media', label: 'Ámbar' },
  { value: 'baja', label: 'Verdes' },
];

const estadoOptions: { value: EstadoAlerta | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'VISTA', label: 'Vista' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'DESCARTADA', label: 'Descartada' },
];

const estadoBadge: Record<EstadoAlerta, string> = {
  PENDIENTE: 'text-[var(--fg-muted)] border-[var(--border-strong)]',
  VISTA: 'text-[var(--primary-700)] border-[var(--primary-200)] bg-[var(--primary-50)]',
  RESUELTA: 'text-[var(--sev-baja-fg)] border-transparent bg-[var(--sev-baja-bg)]',
  DESCARTADA: 'text-[var(--fg-subtle)] border-[var(--border)] bg-[var(--surface-sunken)]',
};

const estadoLabel: Record<EstadoAlerta, string> = {
  PENDIENTE: 'Pendiente',
  VISTA: 'Vista',
  RESUELTA: 'Resuelta',
  DESCARTADA: 'Descartada',
};

const formatFecha = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/** Mapea el chip de semáforo a la prioridad exacta que soporta el backend (RN-11). */
function tonesForFilter(f: SemaforoFiltro): PrioridadAlerta[] | null {
  if (f === 'critica') return ['CRITICA', 'ALTA'];
  if (f === 'media') return ['MEDIA'];
  if (f === 'baja') return ['BAJA', 'INFO'];
  return null;
}

export default function AlertsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dashboard, setDashboard] = useState<DashboardAlertas | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [semaforo, setSemaforo] = useState<SemaforoFiltro>('TODAS');
  const [estado, setEstado] = useState<EstadoAlerta | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Panel de detalle (abre al click de fila)
  const [detailId, setDetailId] = useState<string | null>(null);

  const [notasModal, setNotasModal] = useState<{ id: string; tipo: 'resolver' | 'descartar' } | null>(null);
  const [notas, setNotas] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Query param inicial desde el hero de /dashboard (UX-5): ?semaforo=critica|media|baja
  useEffect(() => {
    const q = searchParams.get('semaforo');
    if (q === 'critica' || q === 'media' || q === 'baja') {
      setSemaforo(q);
    }
  }, [searchParams]);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(await alertasService.getDashboard());
    } catch {
      // el header de contadores no debe romper la página si falla
    }
  }, []);

  // El backend NO soporta filtro por prioridad múltiple (chip rojo = CRITICA+ALTA) ni
  // búsqueda de texto en /alertas — se resuelven client-side sobre la página cargada
  // (desvío documentado en el reporte final). Sí soporta paginación server-side
  // (page/limit) y filtro por `estado` — esos van directo al query.
  const loadAlertas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await alertasService.getAlertasPaginated({
        estado: estado || undefined,
        page,
        limit,
      });
      setAlertas(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar las alertas'));
    } finally {
      setLoading(false);
    }
  }, [estado, page, limit]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadAlertas();
  }, [loadAlertas]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), DEBOUNCE_MS);
  };

  const refetchAll = useCallback(() => {
    loadDashboard();
    loadAlertas();
  }, [loadDashboard, loadAlertas]);

  // Filtro de semáforo + búsqueda de texto: client-side sobre la página actual
  // (el backend pagina por estado, no por prioridad agrupada ni texto libre).
  const visibleAlertas = useMemo(() => {
    const tones = tonesForFilter(semaforo);
    const term = search.trim().toLowerCase();
    return alertas.filter((a) => {
      if (tones && !tones.includes(a.prioridad)) return false;
      if (term) {
        const persona = a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : '';
        const haystack = `${a.titulo} ${a.mensaje} ${persona} ${a.persona?.numeroDocumento ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [alertas, semaforo, search]);

  const detailAlerta = useMemo(
    () => alertas.find((a) => a.id === detailId) ?? null,
    [alertas, detailId]
  );

  const chipCount = (f: SemaforoFiltro): number | null => {
    if (!dashboard) return null;
    if (f === 'TODAS') return dashboard.pendientes;
    if (f === 'critica') return dashboard.porPrioridad.critica + dashboard.porPrioridad.alta;
    if (f === 'media') return dashboard.porPrioridad.media;
    return dashboard.porPrioridad.baja + dashboard.porPrioridad.info;
  };

  const runAction = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn();
      refetchAll();
    } catch (err) {
      const msg = extractErrorMessage(err, 'No se pudo completar la acción');
      setError(msg);
      notify.error('No se pudo completar la acción', msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleVista = (id: string) =>
    runAction(id, async () => {
      await alertasService.marcarVista(id);
      notify.success('Alerta marcada como vista');
    });

  const handleConfirmModal = () => {
    if (!notasModal) return;
    const { id, tipo } = notasModal;
    runAction(id, async () => {
      if (tipo === 'resolver') {
        await alertasService.resolver(id, notas.trim() || undefined);
        notify.success('Alerta resuelta', 'Quedó registrada con sus notas.');
      } else {
        await alertasService.descartar(id, notas.trim() || undefined);
        notify.info('Alerta descartada');
      }
      setNotasModal(null);
      setNotas('');
      setDetailId(null);
    });
  };

  const openNotas = (id: string, tipo: 'resolver' | 'descartar') => {
    setNotas('');
    setNotasModal({ id, tipo });
  };

  const columns: DataTableColumn<Alerta>[] = [
    {
      id: 'severidad',
      header: 'Severidad',
      className: 'w-[130px] pl-0',
      cell: (a) => {
        const tone = priorityToTone(a.prioridad);
        return (
          <div className="flex items-center gap-2.5">
            {/* Banda de severidad — indicador cromático de prioridad (RN-11) */}
            <span
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: TONE_VARS[tone].solid }}
              aria-hidden
            />
            <Badge variant={tone}>{a.prioridad}</Badge>
          </div>
        );
      },
    },
    {
      id: 'titulo',
      header: 'Alerta',
      className: 'max-w-md',
      cell: (a) => (
        <div className="max-w-md">
          <p className="font-medium leading-snug text-[var(--fg)] [text-wrap:pretty]">
            {a.titulo}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--fg-muted)]">
            {a.mensaje}
          </p>
        </div>
      ),
    },
    {
      id: 'afiliado',
      header: 'Afiliado',
      cell: (a) =>
        a.personaId ? (
          <Link
            href={`/dashboard/afiliados/${a.personaId}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[var(--primary-700)] hover:underline"
          >
            {a.persona ? `${a.persona.apellido}, ${a.persona.nombre}` : 'Ver ficha'}
          </Link>
        ) : (
          <span className="text-[var(--fg-subtle)]">—</span>
        ),
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: (a) => (
        <span
          className={cn(
            'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors',
            estadoBadge[a.estado]
          )}
        >
          {estadoLabel[a.estado]}
        </span>
      ),
    },
    {
      id: 'hace',
      header: 'Hace cuánto',
      cell: (a) => timeAgo(a.createdAt),
      numeric: true,
      align: 'right',
    },
    {
      id: 'fecha',
      header: 'Fecha objetivo',
      cell: (a) => formatFecha(a.fechaObjetivo ?? a.createdAt),
      numeric: true,
      align: 'right',
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'right',
      cell: (a) => {
        const isBusy = busyId === a.id;
        return (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {a.estado === 'PENDIENTE' && (
              <IconAction
                label="Marcar vista"
                onClick={() => handleVista(a.id)}
                disabled={isBusy}
                icon={isBusy ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              />
            )}
            {a.estado !== 'RESUELTA' && (
              <IconAction
                label="Resolver"
                tone="primary"
                onClick={() => openNotas(a.id, 'resolver')}
                disabled={isBusy}
                icon={<CheckCircle2 className="size-4" />}
              />
            )}
            {a.estado !== 'DESCARTADA' && (
              <IconAction
                label="Descartar"
                tone="danger"
                onClick={() => openNotas(a.id, 'descartar')}
                disabled={isBusy}
                icon={<XCircle className="size-4" />}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--fg)]">Alertas</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Gestión de alertas generadas por reglas del sistema. Hacé clic en una fila para ver el detalle.
          </p>
        </div>
        <Button variant="outline" onClick={refetchAll} disabled={loading}>
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* Chips de semáforo con contadores (RN-11, desde getDashboard) */}
      <div className="flex flex-wrap items-center gap-2">
        {SEMAFORO_CHIPS.map((chip) => {
          const active = semaforo === chip.value;
          const count = chipCount(chip.value);
          const tone = chip.value === 'TODAS' ? null : chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                setSemaforo(chip.value);
                router.replace(
                  chip.value === 'TODAS' ? '/dashboard/alerts' : `/dashboard/alerts?semaforo=${chip.value}`
                );
              }}
              aria-pressed={active}
              className={cn(
                'group inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium',
                'transition-[background-color,border-color,color,box-shadow] duration-150 ease-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                active
                  ? 'border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)] shadow-[var(--shadow-sm)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)] hover:text-[var(--fg)]'
              )}
            >
              {tone && (
                <span
                  className={cn(
                    'size-2 rounded-full transition-transform duration-150',
                    active && 'scale-125'
                  )}
                  style={{ backgroundColor: TONE_VARS[tone].solid }}
                  aria-hidden
                />
              )}
              {chip.label}
              {count !== null && (
                <span
                  className={cn(
                    'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs tabular-nums transition-colors',
                    active
                      ? 'bg-[var(--primary-600)] text-white'
                      : 'bg-[var(--surface-sunken)] text-[var(--fg-muted)] group-hover:bg-[var(--border)]'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtro por estado. Obra social omitido: QueryAlertasDto no expone ese filtro
          (el backend resuelve multi-tenancy automáticamente por el usuario logueado,
          no como filtro elegible en /alertas). */}
      <div className="w-56">
        <SearchableSelect
          options={estadoOptions}
          value={estado}
          onChange={(v) => {
            setEstado(v as EstadoAlerta | '');
            setPage(1);
          }}
          placeholder="Estado"
        />
      </div>

      {error && (
        <div className="rounded-md border border-[var(--sev-critica-bg)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={visibleAlertas}
        getRowId={(a) => a.id}
        loading={loading}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por título, afiliado, DNI…"
        onRowClick={(a) => setDetailId(a.id)}
        pagination={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => {
              setLimit(v);
              setPage(1);
            }}
          />
        }
        emptyTitle="Sin alertas"
        emptyDescription="No hay alertas con los filtros actuales."
      />

      {/* Panel de detalle lateral (UX-8a) */}
      <AlertDetailSheet
        alerta={detailAlerta}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        busy={busyId !== null}
        onVista={handleVista}
        onResolver={(id) => openNotas(id, 'resolver')}
        onDescartar={(id) => openNotas(id, 'descartar')}
      />

      {/* Modal de resolución/descarte con notas */}
      <Dialog
        open={notasModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNotasModal(null);
            setNotas('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {notasModal?.tipo === 'resolver' ? 'Resolver alerta' : 'Descartar alerta'}
            </DialogTitle>
            <DialogDescription>
              Las notas quedan asociadas a la alerta como registro de la acción tomada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--fg-muted)]">
              Notas de resolución <span className="font-normal text-[var(--fg-subtle)]">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={1000}
              rows={4}
              autoFocus
              placeholder="Descripción de la acción tomada…"
              className="w-full resize-none rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)] focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--primary-600)_18%,transparent)]"
            />
            <p className="text-right text-xs text-[var(--fg-subtle)] tabular-nums">{notas.length}/1000</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNotasModal(null);
                setNotas('');
              }}
              disabled={busyId !== null}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={notasModal?.tipo === 'descartar' ? 'destructive' : 'default'}
              onClick={handleConfirmModal}
              disabled={busyId !== null}
            >
              {busyId !== null && <Loader2 className="size-4 animate-spin" />}
              {notasModal?.tipo === 'resolver' ? 'Confirmar resolución' : 'Confirmar descarte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Botón de acción con icono + tooltip (affordance clara, no icono crudo). */
function IconAction({
  label,
  icon,
  onClick,
  disabled,
  tone = 'neutral',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'primary' | 'danger';
}) {
  const toneClass = {
    neutral: 'text-[var(--fg-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--fg)]',
    primary: 'text-[var(--primary-700)] hover:bg-[var(--primary-50)]',
    danger: 'text-[var(--fg-subtle)] hover:bg-[var(--sev-critica-bg)] hover:text-[var(--sev-critica-fg)]',
  }[tone];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
            'disabled:opacity-50 disabled:pointer-events-none',
            toneClass
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
