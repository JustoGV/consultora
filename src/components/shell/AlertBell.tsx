"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";

import { alertasService } from "@/services/alertasService";
import type { Alerta, DashboardAlertas } from "@/types";
import {
  maxToneFromCounts,
  priorityToTone,
  TONE_VARS,
  type SeverityTone,
} from "@/lib/severity";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const REFETCH_MS = 60_000; // polling suave (UX-4) — sin websockets por ahora
const MAX_ITEMS = 8;

/**
 * AlertBell — campana de alertas del topbar (versión básica UX-1; la gestión
 * inline llega en UX-4).
 *
 * - Badge numérico = total PENDIENTE, coloreado por la severidad máxima presente
 *   (rojo si CRITICA/ALTA, ámbar si MEDIA, verde si solo BAJA/INFO — RN-11).
 * - Refetch cada 60s del dashboard; al abrir la bandeja trae las últimas alertas.
 * - Pulso único cuando sube la severidad máxima (moment de hand-craft).
 */
export default function AlertBell() {
  const [dashboard, setDashboard] = useState<DashboardAlertas | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [ping, setPing] = useState(false);
  const prevToneRank = useRef<number>(0);

  const rankOf = (t: SeverityTone | null) =>
    t === "critica" ? 3 : t === "media" ? 2 : t === "baja" ? 1 : 0;

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await alertasService.getDashboard();
      // Detectar si subió la severidad máxima → pulso único (moment de hand-craft)
      const rank = rankOf(maxToneFromCounts(data.porPrioridad));
      if (rank > prevToneRank.current && prevToneRank.current !== 0) {
        setPing(true);
        window.setTimeout(() => setPing(false), 600);
      }
      prevToneRank.current = rank;
      setDashboard(data);
    } catch {
      // silencioso: la campana no debe romper el shell si el backend falla
    }
  }, []);

  // Polling del dashboard (badge + color). El primer fetch se difiere para no
  // llamar setState de forma síncrona dentro del effect (patrón del repo).
  useEffect(() => {
    const first = window.setTimeout(fetchDashboard, 0);
    const id = window.setInterval(fetchDashboard, REFETCH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [fetchDashboard]);

  const tone: SeverityTone | null = dashboard
    ? maxToneFromCounts(dashboard.porPrioridad)
    : null;
  const pendientes = dashboard?.pendientes ?? 0;

  // Al abrir la bandeja, traer las últimas PENDIENTE
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      setLoadingList(true);
      alertasService
        .getAlertas({ estado: "PENDIENTE" })
        .then((list) => {
          const sorted = [...list].sort((a, b) => {
            const ra =
              priorityToTone(a.prioridad) === "critica"
                ? 3
                : priorityToTone(a.prioridad) === "media"
                  ? 2
                  : 1;
            const rb =
              priorityToTone(b.prioridad) === "critica"
                ? 3
                : priorityToTone(b.prioridad) === "media"
                  ? 2
                  : 1;
            if (rb !== ra) return rb - ra;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
          setAlertas(sorted.slice(0, MAX_ITEMS));
        })
        .catch(() => setAlertas([]))
        .finally(() => setLoadingList(false));
    }
  }, []);

  const badgeColor = tone ? TONE_VARS[tone].solid : "var(--neutral-400)";

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label={`Alertas${pendientes ? `: ${pendientes} pendientes` : ""}`}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-md text-[var(--fg-muted)]",
          "transition-colors duration-150 hover:bg-[var(--surface-sunken)] hover:text-[var(--fg)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
          ping && "animate-bell-ping"
        )}
      >
        <Bell className="size-5" />
        {pendientes > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-4 text-white tabular-nums"
            style={{ backgroundColor: badgeColor }}
          >
            {pendientes > 99 ? "99+" : pendientes}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="gap-0">
          <SheetHeader>
            <SheetTitle>Alertas pendientes</SheetTitle>
            <SheetDescription>
              {pendientes > 0
                ? `${pendientes} sin atender`
                : "No hay alertas pendientes."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <ul className="divide-y divide-[var(--border)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex gap-3 px-5 py-3.5">
                    <span className="mt-1 size-2 shrink-0 rounded-full skeleton" />
                    <div className="flex-1 space-y-2">
                      <span className="skeleton block h-3.5 w-3/4 rounded" />
                      <span className="skeleton block h-3 w-1/2 rounded" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--fg-subtle)]">
                  <Bell className="size-6" />
                </div>
                <p className="text-sm text-[var(--fg-muted)]">
                  Todo al día. Sin alertas pendientes.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {alertas.map((a) => (
                  <AlertRow key={a.id} alerta={a} onNavigate={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </div>

          <SheetFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/alerts" onClick={() => setOpen(false)}>
                Ver todas
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Fila de alerta en la bandeja: color semáforo, título, persona, hace cuánto. */
function AlertRow({
  alerta,
  onNavigate,
}: {
  alerta: Alerta;
  onNavigate: () => void;
}) {
  const tone = priorityToTone(alerta.prioridad);
  const persona = alerta.persona
    ? `${alerta.persona.apellido ?? ""}, ${alerta.persona.nombre ?? ""}`.replace(
        /^,\s*|,\s*$/g,
        ""
      )
    : null;

  const inner = (
    <div className="flex gap-3">
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: TONE_VARS[tone].solid }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--fg)]">
          {alerta.titulo}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
          {persona && <span className="truncate">{persona}</span>}
          {persona && <span className="text-[var(--fg-subtle)]">·</span>}
          <span className="shrink-0 tabular-nums">{timeAgo(alerta.createdAt)}</span>
        </div>
      </div>
    </div>
  );

  // Link a la ficha de la persona si tenemos el id.
  // OJO: la ruta de destino sigue siendo /dashboard/afiliados/:id (la página de
  // detalle de personas todavía no existe, es F-5) — solo cambia la fuente del id.
  if (alerta.personaId) {
    return (
      <li>
        <Link
          href={`/dashboard/afiliados/${alerta.personaId}`}
          onClick={onNavigate}
          className="block px-5 py-3.5 transition-colors hover:bg-[var(--surface-sunken)]"
        >
          {inner}
        </Link>
      </li>
    );
  }
  return <li className="px-5 py-3.5">{inner}</li>;
}
