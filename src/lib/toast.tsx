"use client";

import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * notify — API de feedback única del design system (UX-8).
 *
 * Envuelve sonner para que TODA la app dispare toasts consistentes: icono
 * Lucide coherente por tono, título en negrita + descripción opcional. Reemplaza
 * los `alert()` nativos y los banners caseros de confirmación de acción.
 *
 *   notify.success("Alerta marcada como vista")
 *   notify.error("No se pudo eliminar", "Reintentá en unos segundos")
 *   notify.info("Sin cambios")
 *   const id = notify.loading("Guardando…"); … notify.success("Listo", undefined, { id })
 *
 * Nota RN-11: el rojo/verde de estos toasts es "estado de acción" (éxito/error de
 * una operación), NO el semáforo de severidad clínica. Por eso viven fuera de
 * severity.ts y usan iconos, no el badge de prioridad.
 */

type NotifyOpts = {
  description?: ReactNode;
  /** Reusar/actualizar un toast existente (p. ej. loading → success). */
  id?: string | number;
  /** Duración custom en ms. */
  duration?: number;
};

const ICON_CLASS = "size-[18px] shrink-0";

function success(title: ReactNode, description?: ReactNode, opts?: NotifyOpts) {
  return sonnerToast(title, {
    ...opts,
    description: description ?? opts?.description,
    icon: <CheckCircle2 className={ICON_CLASS} style={{ color: "var(--primary-600)" }} />,
    className: "gvg-toast gvg-toast--success",
  });
}

function error(title: ReactNode, description?: ReactNode, opts?: NotifyOpts) {
  return sonnerToast(title, {
    ...opts,
    description: description ?? opts?.description,
    icon: <XCircle className={ICON_CLASS} style={{ color: "var(--sev-critica)" }} />,
    className: "gvg-toast gvg-toast--error",
    duration: opts?.duration ?? 6000,
  });
}

function info(title: ReactNode, description?: ReactNode, opts?: NotifyOpts) {
  return sonnerToast(title, {
    ...opts,
    description: description ?? opts?.description,
    icon: <Info className={ICON_CLASS} style={{ color: "var(--fg-muted)" }} />,
    className: "gvg-toast gvg-toast--info",
  });
}

function loading(title: ReactNode, opts?: NotifyOpts) {
  return sonnerToast(title, {
    ...opts,
    icon: <Loader2 className={`${ICON_CLASS} animate-spin`} style={{ color: "var(--fg-muted)" }} />,
    className: "gvg-toast gvg-toast--loading",
    duration: opts?.duration ?? Infinity,
  });
}

function dismiss(id?: string | number) {
  sonnerToast.dismiss(id);
}

export const notify = { success, error, info, loading, dismiss };
