"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — design system (UX-1). Coincide con la convención de las páginas CRUD
 * existentes (borde neutral, foco anillo teal). Agregá la clase `tabular-nums`
 * para DNI/carnets/importes.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)]",
        "placeholder:text-[var(--fg-subtle)] shadow-[var(--shadow-sm)]",
        "transition-[border-color,box-shadow] duration-150 outline-none",
        "focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--primary-600)_18%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--sev-critica)] aria-invalid:bg-[var(--sev-critica-bg)]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Input };
