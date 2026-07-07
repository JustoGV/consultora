"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * ConfirmDialog — confirmación de acciones (UX-8b). Reemplaza el `confirm()`
 * nativo del navegador por un diálogo consistente con el design system:
 * jerarquía clara (acción destructiva en rojo, cancelar como secundario),
 * icono de advertencia, y estado de carga en el botón mientras corre la request.
 *
 * Dos formas de uso:
 *  1. Controlado (declarativo) — <ConfirmDialog open=… onConfirm=… />.
 *  2. Imperativo — const confirm = useConfirm(); if (await confirm({...})) { … }
 *     (ver ConfirmProvider más abajo).
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción destructiva → botón rojo + icono de advertencia. */
  destructive?: boolean;
  /** Muestra spinner y bloquea los botones mientras corre la acción. */
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return; // no cerrar mientras corre la acción
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {destructive && (
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--sev-critica-bg)]"
                aria-hidden
              >
                <AlertTriangle className="size-[18px] text-[var(--sev-critica)]" />
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className={cn(loading && "pointer-events-none")}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel ?? (destructive ? "Eliminar" : "Confirmar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   API imperativa — useConfirm()
   Permite reemplazar `if (!confirm(...)) return;` por
   `if (!(await confirm({...}))) return;` sin cablear estado en cada página.
   ============================================================ */

type ConfirmOptions = Omit<
  ConfirmDialogProps,
  "open" | "onOpenChange" | "onConfirm" | "loading"
>;

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((v: boolean) => void) | null>(null);

  const confirm = React.useCallback<ConfirmContextValue>((opts) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={state?.title ?? ""}
        description={state?.description}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        destructive={state?.destructive}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>.");
  }
  return ctx;
}
