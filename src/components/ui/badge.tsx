import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — design system (UX-1).
 * Variantes de severidad (critica/media/baja) mapean el semáforo RN-11 y son
 * el ÚNICO uso permitido de rojo/ámbar/verde. Ver helper severityToBadge en /DESIGN.md.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap w-fit " +
    "transition-colors [&_svg]:size-3 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary-600)] text-white",
        secondary:
          "border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--fg-muted)]",
        outline: "border-[var(--border-strong)] text-[var(--fg)]",
        // Severidad (semáforo RN-11) — uso exclusivo para prioridad de alerta
        critica:
          "border-transparent bg-[var(--sev-critica-bg)] text-[var(--sev-critica-fg)]",
        media:
          "border-transparent bg-[var(--sev-media-bg)] text-[var(--sev-media-fg)]",
        baja: "border-transparent bg-[var(--sev-baja-bg)] text-[var(--sev-baja-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
