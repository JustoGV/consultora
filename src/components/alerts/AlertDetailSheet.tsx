"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  XCircle,
  User,
  Hash,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Clock,
  FileText,
  ClipboardList,
  ArrowUpRight,
  ListChecks,
  Loader2,
} from "lucide-react";

import type { Alerta, EstadoAlerta, PosibleSolucion } from "@/types";
import { priorityToTone, TONE_VARS, TONE_LABEL } from "@/lib/severity";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

/** Badge de estado consistente con la tabla (misma paleta semántica). */
const ESTADO_STYLES: Record<EstadoAlerta, string> = {
  PENDIENTE: "text-[var(--fg-muted)] border-[var(--border-strong)] bg-[var(--surface)]",
  VISTA: "text-[var(--primary-700)] border-[var(--primary-200)] bg-[var(--primary-50)]",
  RESUELTA: "text-[var(--sev-baja-fg)] border-transparent bg-[var(--sev-baja-bg)]",
  DESCARTADA: "text-[var(--fg-subtle)] border-[var(--border)] bg-[var(--surface-sunken)]",
};

const ESTADO_LABEL: Record<EstadoAlerta, string> = {
  PENDIENTE: "Pendiente",
  VISTA: "Vista",
  RESUELTA: "Resuelta",
  DESCARTADA: "Descartada",
};

function formatFechaLarga(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Acciones de `posiblesSoluciones` con ruta concreta → navegan. El resto se
 * muestran como guía (sin handler, no clickeables). El backend manda
 * `codigoAlerta.posiblesSoluciones: [{ texto, accion }]`.
 */
function resolveSolucionHref(sol: PosibleSolucion, alerta: Alerta): string | null {
  switch (sol.accion) {
    case "ver_persona":
      return alerta.personaId ? `/dashboard/pacientes/${alerta.personaId}` : null;
    case "listar_orientaciones":
      return "/dashboard/orientacion-prestacional";
    case "cargar_certificado":
    case "renovar_certificado":
      return "/dashboard/certificados-discapacidad";
    // ver_certificado / ver_orientacion: sin ruta de detalle directa por id
    // en el front actual → se muestran como guía.
    default:
      return null;
  }
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}

function DetailRow({ icon: Icon, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-[var(--fg)]">{children}</div>
      </div>
    </div>
  );
}

export interface AlertDetailSheetProps {
  alerta: Alerta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onVista: (id: string) => void;
  onResolver: (id: string) => void;
  onDescartar: (id: string) => void;
}

/**
 * Panel de detalle de alerta (UX-8a). Emerge desde la derecha (mismo patrón que
 * la bandeja de la campana). Muestra TODO: mensaje completo, semáforo grande,
 * código + descripción del catálogo, paciente (link a ficha), fechas, historia
 * de estado (resuelta por / notas) y las `posiblesSoluciones` como botones de
 * acción. Desde acá se ejecutan Vista / Resolver / Descartar.
 */
export function AlertDetailSheet({
  alerta,
  open,
  onOpenChange,
  busy,
  onVista,
  onResolver,
  onDescartar,
}: AlertDetailSheetProps) {
  if (!alerta) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="max-w-md" />
      </Sheet>
    );
  }

  const tone = priorityToTone(alerta.prioridad);
  const toneVars = TONE_VARS[tone];
  const soluciones = alerta.codigoAlerta?.posiblesSoluciones ?? [];
  const isPendiente = alerta.estado === "PENDIENTE";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md gap-0 p-0">
        {/* Cabecera con semáforo grande */}
        <SheetHeader className="gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2.5 pr-8">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: toneVars.bg }}
              aria-hidden
            >
              <span
                className="size-3.5 rounded-full"
                style={{ backgroundColor: toneVars.solid }}
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={tone}>{alerta.prioridad}</Badge>
                <span
                  className={cn(
                    "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
                    ESTADO_STYLES[alerta.estado]
                  )}
                >
                  {ESTADO_LABEL[alerta.estado]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--fg-subtle)]">
                Severidad {TONE_LABEL[tone].toLowerCase()}
              </p>
            </div>
          </div>
          <SheetTitle className="text-base leading-snug text-[var(--fg)]">
            {alerta.titulo}
          </SheetTitle>
        </SheetHeader>

        {/* Cuerpo scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Mensaje completo (sin truncar) */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3.5 py-3">
            <p className="text-sm leading-relaxed text-[var(--fg)]">{alerta.mensaje}</p>
          </div>

          {/* Acciones sugeridas — posiblesSoluciones del código de alerta */}
          {soluciones.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2">
                <ListChecks className="size-4 text-[var(--fg-subtle)]" aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
                  Acciones sugeridas
                </h3>
              </div>
              <div className="flex flex-col gap-1.5">
                {soluciones.map((sol, i) => {
                  const href = resolveSolucionHref(sol, alerta);
                  if (href) {
                    return (
                      <Link
                        key={i}
                        href={href}
                        onClick={() => onOpenChange(false)}
                        className="group flex items-center justify-between gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] transition-colors hover:border-[var(--primary-600)] hover:bg-[var(--primary-50)]"
                      >
                        <span className="min-w-0">{sol.texto}</span>
                        <ArrowUpRight className="size-4 shrink-0 text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--primary-700)]" />
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-sm text-[var(--fg-muted)]"
                    >
                      <ClipboardList className="mt-0.5 size-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
                      <span>{sol.texto}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadatos */}
          <div className="mt-4 divide-y divide-[var(--border)] border-t border-[var(--border)]">
            <DetailRow icon={User} label="Paciente">
              {alerta.personaId ? (
                <Link
                  href={`/dashboard/pacientes/${alerta.personaId}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 font-medium text-[var(--primary-700)] hover:underline"
                >
                  {alerta.persona
                    ? `${alerta.persona.apellido}, ${alerta.persona.nombre}`
                    : "Ver ficha"}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              ) : (
                <span className="text-[var(--fg-subtle)]">Sin paciente asociado</span>
              )}
              {alerta.persona?.numeroDocumento && (
                <span className="ml-2 text-xs tabular-nums text-[var(--fg-subtle)]">
                  DNI {alerta.persona.numeroDocumento}
                </span>
              )}
            </DetailRow>

            {alerta.codigoAlerta && (
              <DetailRow icon={Hash} label="Código de alerta">
                <span className="tabular-nums font-medium">
                  #{alerta.codigoAlerta.codigo}
                </span>
                <span className="ml-2 text-[var(--fg-muted)]">
                  {alerta.codigoAlerta.descripcion}
                </span>
              </DetailRow>
            )}

            <DetailRow icon={FileText} label="Origen">
              <span className="capitalize text-[var(--fg-muted)]">
                {alerta.entidadOrigen?.replace(/_/g, " ")}
              </span>
            </DetailRow>

            <DetailRow icon={CalendarCheck} label="Creada">
              <span>{formatFechaLarga(alerta.createdAt)}</span>
              <span className="ml-2 text-xs text-[var(--fg-subtle)]">
                {timeAgo(alerta.createdAt)}
              </span>
            </DetailRow>

            {alerta.fechaObjetivo && (
              <DetailRow icon={CalendarClock} label="Fecha objetivo">
                {formatFechaLarga(alerta.fechaObjetivo)}
              </DetailRow>
            )}

            {alerta.validaHasta && (
              <DetailRow icon={Clock} label="Válida hasta">
                {formatFechaLarga(alerta.validaHasta)}
              </DetailRow>
            )}

            {alerta.estado === "RESUELTA" && (
              <DetailRow icon={CalendarCheck} label="Resuelta">
                <div>
                  {alerta.resueltaEn && <span>{formatFechaLarga(alerta.resueltaEn)}</span>}
                  {alerta.resueltaPor?.nombre && (
                    <span className="ml-2 text-[var(--fg-muted)]">
                      por {alerta.resueltaPor.nombre}
                    </span>
                  )}
                </div>
              </DetailRow>
            )}

            {alerta.estado === "DESCARTADA" && (
              <DetailRow icon={CalendarX} label="Descartada">
                <span className="text-[var(--fg-muted)]">
                  {alerta.resueltaPor?.nombre
                    ? `por ${alerta.resueltaPor.nombre}`
                    : "Registrada como descartada"}
                </span>
              </DetailRow>
            )}

            {alerta.notasResolucion && (
              <DetailRow icon={ClipboardList} label="Notas de resolución">
                <p className="whitespace-pre-wrap text-[var(--fg-muted)]">
                  {alerta.notasResolucion}
                </p>
              </DetailRow>
            )}
          </div>
        </div>

        {/* Acciones de gestión */}
        {alerta.estado !== "RESUELTA" && alerta.estado !== "DESCARTADA" && (
          <SheetFooter className="flex-row gap-2 border-t border-[var(--border)] px-5 py-4">
            {isPendiente && (
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => onVista(alerta.id)}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                Vista
              </Button>
            )}
            <Button
              variant="default"
              className="flex-1"
              disabled={busy}
              onClick={() => onResolver(alerta.id)}
            >
              <CheckCircle2 className="size-4" />
              Resolver
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[var(--border-strong)] text-[var(--fg-muted)] hover:border-[var(--sev-critica)] hover:text-[var(--sev-critica-fg)]"
              disabled={busy}
              onClick={() => onDescartar(alerta.id)}
            >
              <XCircle className="size-4" />
              Descartar
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
