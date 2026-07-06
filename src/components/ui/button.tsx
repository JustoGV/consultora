"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button — design system (UX-1). Radios crisp, foco visible, transiciones 150ms.
 * Variantes: default (teal), outline, ghost, subtle, destructive, link.
 * El look sale de nuestros tokens (var(--primary-*), var(--border), …), no del default de shadcn.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "transition-[background-color,box-shadow,border-color,color] duration-150 ease-out cursor-pointer " +
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-600)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-700)] active:bg-[var(--primary-800)]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-[var(--fg)] hover:bg-[var(--surface-sunken)]",
        ghost: "bg-transparent text-[var(--fg)] hover:bg-[var(--surface-sunken)]",
        subtle:
          "bg-[var(--primary-50)] text-[var(--primary-700)] hover:bg-[var(--primary-100)]",
        destructive:
          "bg-[var(--sev-critica)] text-white shadow-[var(--shadow-sm)] hover:brightness-95",
        link: "text-[var(--primary-600)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
