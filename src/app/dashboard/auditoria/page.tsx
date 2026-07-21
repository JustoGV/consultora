'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { auditoriaService } from '@/services/auditoriaService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import Pagination from '@/components/Pagination';
import SearchableSelect from '@/components/SearchableSelect';
import type { AccionAuditoria, RegistroAuditoria } from '@/types';
import { AuditoriaDetailSheet } from './AuditoriaDetailSheet';

const DEBOUNCE_MS = 300;

/** Mapeo entidad (tabla SQL) → label legible, en el orden que expone el filtro. */
export const ENTIDAD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'personas', label: 'Personas' },
  { value: 'afiliaciones', label: 'Afiliaciones' },
  { value: 'certificados_discapacidad', label: 'Certificados' },
  { value: 'obras_sociales', label: 'Obras sociales' },
  { value: 'orientaciones_prestacionales', label: 'Orientaciones' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'servicios_no_nomenclados', label: 'Servicios no nomenclados' },
  { value: 'efectores', label: 'Efectores' },
  { value: 'prestadores', label: 'Prestadores' },
  { value: 'nomencladores', label: 'Nomencladores' },
  { value: 'profesionales', label: 'Terceros vinculados' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'auth', label: 'Sesiones' },
  { value: 'alertas', label: 'Alertas' },
  { value: 'categorias', label: 'Categorías' },
  { value: 'estado_civil', label: 'Estado civil' },
  { value: 'tipo_discapacidad', label: 'Tipos de discapacidad' },
  { value: 'parentescos', label: 'Parentescos' },
  { value: 'afiliacion_vinculos', label: 'Vínculos' },
];

export const ENTIDAD_LABEL: Record<string, string> = Object.fromEntries(
  ENTIDAD_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);

const ACCION_OPTIONS: { value: AccionAuditoria | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'CREACION', label: 'Creación' },
  { value: 'ACTUALIZACION', label: 'Actualización' },
  { value: 'ELIMINACION', label: 'Eliminación' },
  { value: 'RESTAURACION', label: 'Restauración' },
  { value: 'LOGIN', label: 'Ingreso' },
  { value: 'LOGIN_FALLIDO', label: 'Ingreso fallido' },
];

export const ACCION_LABEL: Record<AccionAuditoria, string> = {
  CREACION: 'Creación',
  ACTUALIZACION: 'Actualización',
  ELIMINACION: 'Eliminación',
  RESTAURACION: 'Restauración',
  LOGIN: 'Ingreso',
  LOGIN_FALLIDO: 'Ingreso fallido',
};

/** Tokens del design system (mismo patrón que estadoBadge en /dashboard/alerts). */
export const ACCION_BADGE_CLASS: Record<AccionAuditoria, string> = {
  CREACION: 'text-[var(--sev-baja-fg)] border-transparent bg-[var(--sev-baja-bg)]',
  RESTAURACION: 'text-[var(--sev-baja-fg)] border-transparent bg-[var(--sev-baja-bg)]',
  ACTUALIZACION: 'text-[var(--primary-700)] border-[var(--primary-200)] bg-[var(--primary-50)]',
  ELIMINACION: 'text-[var(--sev-critica-fg)] border-transparent bg-[var(--sev-critica-bg)]',
  LOGIN_FALLIDO: 'text-[var(--sev-critica-fg)] border-transparent bg-[var(--sev-critica-bg)]',
  LOGIN: 'text-[var(--fg-muted)] border-[var(--border)] bg-[var(--surface-sunken)]',
};

const inputClass =
  'h-9 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--fg)] ' +
  'outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--fg-subtle)] ' +
  'focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--primary-600)_18%,transparent)]';

/** dd/mm/aaaa HH:mm:ss en zona local. */
export function formatFechaHora(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function truncateValue(value: unknown): string {
  const s = String(value ?? '—');
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

/** Renderiza el resumen de `cambios`: diff {campo:{antes,despues}} o snapshot de creación. */
function renderDetalle(cambios: RegistroAuditoria['cambios']): { text: string; full: string } {
  if (!cambios || typeof cambios !== 'object') return { text: '—', full: '—' };

  const entries = Object.entries(cambios as Record<string, unknown>);
  if (entries.length === 0) return { text: '—', full: '—' };

  const isDiff = entries.every(([, v]) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    return 'antes' in (v as object) || 'despues' in (v as object);
  });

  if (isDiff) {
    const parts = entries.map(([campo, v]) => {
      const { antes, despues } = v as { antes?: unknown; despues?: unknown };
      return `${campo}: ${truncateValue(antes)} → ${truncateValue(despues)}`;
    });
    const shown = parts.slice(0, 2);
    const extra = parts.length > 2 ? ` +${parts.length - 2} más` : '';
    return { text: shown.join(' · ') + extra, full: parts.join('\n') };
  }

  // Snapshot de creación: { campo: valor, ... }
  const allParts = entries.map(([campo, v]) => `${campo}: ${truncateValue(v)}`);
  const text = entries.length <= 2 ? allParts.join(' · ') : `${entries.length} campos`;
  return { text, full: allParts.join('\n') };
}

export default function AuditoriaPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [usuarioInput, setUsuarioInput] = useState('');
  const [usuarioQuery, setUsuarioQuery] = useState('');
  const [entidad, setEntidad] = useState('');
  const [accion, setAccion] = useState<AccionAuditoria | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [registroSeleccionado, setRegistroSeleccionado] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  const loadAuditoria = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditoriaService.getPaginated({
        usuario: usuarioQuery || undefined,
        entidad: entidad || undefined,
        accion: accion || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page,
        limit,
      });
      setRegistros(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cargar el registro de auditoría'));
    } finally {
      setLoading(false);
    }
  }, [usuarioQuery, entidad, accion, desde, hasta, page, limit]);

  useEffect(() => {
    if (isAdmin) loadAuditoria();
  }, [isAdmin, loadAuditoria]);

  const handleUsuarioChange = (value: string) => {
    setUsuarioInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setUsuarioQuery(value);
      setPage(1);
    }, DEBOUNCE_MS);
  };

  const columns: DataTableColumn<RegistroAuditoria>[] = [
    {
      id: 'fecha',
      header: 'Fecha y hora',
      cell: (r) => formatFechaHora(r.createdAt),
      numeric: true,
    },
    {
      id: 'usuario',
      header: 'Usuario',
      cell: (r) => (
        <div>
          <p className="font-medium text-[var(--fg)]">{r.usuarioEmail ?? 'Sistema'}</p>
          {r.usuarioRol && <p className="text-xs text-[var(--fg-muted)]">{r.usuarioRol}</p>}
        </div>
      ),
    },
    {
      id: 'accion',
      header: 'Acción',
      cell: (r) => (
        <span
          className={cn(
            'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors',
            ACCION_BADGE_CLASS[r.accion]
          )}
        >
          {ACCION_LABEL[r.accion]}
        </span>
      ),
    },
    {
      id: 'entidad',
      header: 'Entidad',
      cell: (r) => ENTIDAD_LABEL[r.entidad] ?? r.entidad,
    },
    {
      id: 'detalle',
      header: 'Detalle',
      className: 'max-w-md',
      cell: (r) => {
        const { text, full } = renderDetalle(r.cambios);
        return (
          <p
            title={full}
            className="line-clamp-2 max-w-md text-xs leading-relaxed text-[var(--fg-muted)]"
          >
            {text}
          </p>
        );
      },
    },
  ];

  // Guards de acceso: los USER no ven esta página (permiso resuelto client-side,
  // el backend igual reaplica administradora_id server-side).
  if (authLoading) return null;
  if (!isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--fg-muted)]">No tenés permiso para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[var(--fg)]">Auditoría</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Registro de movimientos del sistema: quién hizo qué y cuándo.
        </p>
      </div>

      {/* Filtros server-side */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-subtle)]"
            aria-hidden
          />
          <input
            type="text"
            value={usuarioInput}
            onChange={(e) => handleUsuarioChange(e.target.value)}
            placeholder="Buscar por email de usuario…"
            aria-label="Buscar por email de usuario"
            className={cn(inputClass, 'pl-8')}
          />
        </div>

        <div className="w-56">
          <SearchableSelect
            options={ENTIDAD_OPTIONS}
            value={entidad}
            onChange={(v) => {
              setEntidad(v);
              setPage(1);
            }}
            placeholder="Entidad"
          />
        </div>

        <div className="w-52">
          <SearchableSelect
            options={ACCION_OPTIONS}
            value={accion}
            onChange={(v) => {
              setAccion(v as AccionAuditoria | '');
              setPage(1);
            }}
            placeholder="Acción"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="auditoria-desde" className="text-xs font-medium text-[var(--fg-muted)]">
            Desde
          </label>
          <input
            id="auditoria-desde"
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
            className={cn(inputClass, 'w-40')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="auditoria-hasta" className="text-xs font-medium text-[var(--fg-muted)]">
            Hasta
          </label>
          <input
            id="auditoria-hasta"
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
            className={cn(inputClass, 'w-40')}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[var(--sev-critica-bg)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={registros}
        getRowId={(r) => r.id}
        loading={loading}
        onRowClick={(r) => {
          setRegistroSeleccionado(r.id);
          setSheetOpen(true);
        }}
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
        emptyTitle="Sin registros"
        emptyDescription="No hay movimientos con los filtros actuales."
      />

      <AuditoriaDetailSheet
        registroId={registroSeleccionado}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
