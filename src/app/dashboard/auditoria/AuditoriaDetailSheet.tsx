'use client';

import { useEffect, useState } from 'react';
import { User, Globe, FileText, Building2 } from 'lucide-react';

import type { AccionAuditoria, RegistroAuditoriaDetalle } from '@/types';
import { auditoriaService } from '@/services/auditoriaService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ACCION_LABEL, ACCION_BADGE_CLASS, ENTIDAD_LABEL, formatFechaHora } from './page';

/** Español para las keys de `cambios` más frecuentes. Fallback: camelCase → 'Camel case'. */
const FIELD_LABELS: Record<string, string> = {
  obraSocialId: 'Obra social',
  numeroAfiliado: 'N° de afiliado',
  fechaNacimiento: 'Fecha de nacimiento',
  estadoCivilId: 'Estado civil',
  tipoDiscapacidadId: 'Tipo de discapacidad',
  numeroDocumento: 'N° de documento',
  tipoDocumento: 'Tipo de documento',
  codigoPostal: 'Código postal',
  activo: 'Activo',
  email: 'Email',
  telefono: 'Teléfono',
  celular: 'Celular',
  direccion: 'Dirección',
  localidad: 'Localidad',
  provincia: 'Provincia',
  plan: 'Plan',
  rol: 'Rol',
  observaciones: 'Observaciones',
  fechaEmision: 'Fecha de emisión',
  fechaVencimiento: 'Fecha de vencimiento',
  grado: 'Grado',
  cuil: 'CUIL/CUIT',
  nombre: 'Nombre',
  apellido: 'Apellido',
  sexo: 'Sexo',
};

/** Campos omitidos de la grilla de snapshot (CREACION). */
const SNAPSHOT_OMIT = new Set(['id', 'createdAt', 'updatedAt']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/;

/** Label del campo en español, con fallback camelCase → "Camel case". */
function humanizeField(campo: string): string {
  if (FIELD_LABELS[campo]) return FIELD_LABELS[campo];
  const spaced = campo.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** dd/mm/aaaa (sin hora) — usado para valores de fecha dentro del diff. */
function formatFechaCorta(value: string): string {
  const dateOnly = DATE_ONLY_RE.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${d}/${m}/${y}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Formatea un valor de `cambios` para mostrar: uuid→referencia, fecha→dd/mm/aaaa, bool→Sí/No, vacío→—. */
function formatDiffValue(value: unknown, referencias: Record<string, string>): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  const str = String(value);
  if (UUID_RE.test(str)) return referencias[str] ?? str;
  if (DATE_ONLY_RE.test(str) || ISO_DATE_RE.test(str)) return formatFechaCorta(str);
  return str;
}

function truncateUuid(id: string): string {
  return `${id.slice(0, 8)}…`;
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className="size-4 text-[var(--fg-subtle)]" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function isDiffShape(cambios: RegistroAuditoriaDetalle['cambios']): boolean {
  if (!cambios || typeof cambios !== 'object') return false;
  const entries = Object.entries(cambios as Record<string, unknown>);
  if (entries.length === 0) return false;
  return entries.every(([, v]) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    return 'antes' in (v as object) || 'despues' in (v as object);
  });
}

function CambiosDiff({
  cambios,
  referencias,
}: {
  cambios: Record<string, unknown>;
  referencias: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(cambios).map(([campo, v]) => {
        const { antes, despues } = v as { antes?: unknown; despues?: unknown };
        return (
          <div
            key={campo}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
              {humanizeField(campo)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
              <span className="text-[var(--fg-subtle)] line-through decoration-[var(--border-strong)]">
                {formatDiffValue(antes, referencias)}
              </span>
              <span className="text-[var(--fg-subtle)]">→</span>
              <span className="font-medium text-[var(--fg)]">
                {formatDiffValue(despues, referencias)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CambiosSnapshot({
  cambios,
  referencias,
}: {
  cambios: Record<string, unknown>;
  referencias: Record<string, string>;
}) {
  const entries = Object.entries(cambios).filter(([campo]) => !SNAPSHOT_OMIT.has(campo));
  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([campo, v]) => (
        <div
          key={campo}
          className="rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
            {humanizeField(campo)}
          </p>
          <p className="mt-0.5 text-sm text-[var(--fg)]">{formatDiffValue(v, referencias)}</p>
        </div>
      ))}
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <span className="skeleton block h-4 w-40 rounded" />
      <span className="skeleton block h-3.5 w-full rounded" />
      <span className="skeleton block h-3.5 w-5/6 rounded" />
      <span className="skeleton block h-20 w-full rounded" />
      <span className="skeleton block h-20 w-full rounded" />
    </div>
  );
}

export interface AuditoriaDetailSheetProps {
  registroId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Panel de detalle de un registro de auditoría. Al abrir, carga
 * GET /auditoria/:id (con `referencias` para resolver uuids a labels legibles).
 */
export function AuditoriaDetailSheet({ registroId, open, onOpenChange }: AuditoriaDetailSheetProps) {
  const [registro, setRegistro] = useState<RegistroAuditoriaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !registroId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRegistro(null);
    auditoriaService
      .getById(registroId)
      .then((data) => {
        if (!cancelled) setRegistro(data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'No se pudo cargar el registro de auditoría'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, registroId]);

  const accion = registro?.accion as AccionAuditoria | undefined;
  const referencias = registro?.referencias ?? {};
  const isLogin = accion === 'LOGIN' || accion === 'LOGIN_FALLIDO';
  const cambios = registro?.cambios as Record<string, unknown> | null | undefined;
  const showDiff = !isLogin && isDiffShape(cambios);
  const showSnapshot = !isLogin && !showDiff && cambios && Object.keys(cambios).length > 0;

  const entidadLabel = registro ? ENTIDAD_LABEL[registro.entidad] ?? registro.entidad : '';
  const entidadIdLabel = registro?.entidadId
    ? referencias[registro.entidadId] ?? null
    : null;
  const administradoraLabel = registro?.administradoraId
    ? referencias[registro.administradoraId] ?? null
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md gap-0 p-0">
        <SheetHeader className="gap-2 border-b border-[var(--border)] px-5 py-4">
          {registro && (
            <>
              <div className="flex items-center gap-2 pr-8">
                <span
                  className={cn(
                    'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium',
                    ACCION_BADGE_CLASS[registro.accion]
                  )}
                >
                  {ACCION_LABEL[registro.accion]}
                </span>
                <span className="text-sm text-[var(--fg-muted)]">{entidadLabel}</span>
              </div>
              <SheetTitle className="text-sm font-normal text-[var(--fg-subtle)]">
                {formatFechaHora(registro.createdAt)}
              </SheetTitle>
            </>
          )}
          {!registro && !loading && !error && <SheetTitle className="sr-only">Detalle de auditoría</SheetTitle>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <SheetSkeleton />}

          {!loading && error && (
            <div className="rounded-md border border-[var(--sev-critica-bg)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
              {error}
            </div>
          )}

          {!loading && !error && registro && (
            <div className="flex flex-col gap-4">
              <Section title="Usuario" icon={User}>
                <div className="text-sm">
                  <p className="font-medium text-[var(--fg)]">{registro.usuarioEmail ?? 'Sistema'}</p>
                  {registro.usuarioRol && (
                    <p className="text-xs text-[var(--fg-muted)]">{registro.usuarioRol}</p>
                  )}
                </div>
              </Section>

              <Section title="Origen" icon={Globe}>
                <p className="text-sm text-[var(--fg)]">{registro.ip ?? '—'}</p>
              </Section>

              <Section title="Registro afectado" icon={FileText}>
                <div className="text-sm text-[var(--fg)]">
                  <p>{entidadLabel}</p>
                  {registro.entidadId && (
                    <p className="mt-0.5 text-[var(--fg-muted)]">
                      {entidadIdLabel ?? (
                        <span title={registro.entidadId}>{truncateUuid(registro.entidadId)}</span>
                      )}
                    </p>
                  )}
                </div>
              </Section>

              {administradoraLabel && (
                <Section title="Administradora" icon={Building2}>
                  <p className="text-sm text-[var(--fg)]">{administradoraLabel}</p>
                </Section>
              )}

              {(showDiff || showSnapshot) && (
                <Section title="Cambios" icon={FileText}>
                  {showDiff && (
                    <CambiosDiff cambios={cambios as Record<string, unknown>} referencias={referencias} />
                  )}
                  {showSnapshot && (
                    <CambiosSnapshot cambios={cambios as Record<string, unknown>} referencias={referencias} />
                  )}
                </Section>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
