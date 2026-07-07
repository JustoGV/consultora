"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster — feedback global del design system (UX-8).
 *
 * Sonner retematizado sobre nuestros tokens (teal + neutrales cálidos), con el
 * semáforo RN-11 reservado solo para severidad de alerta (aquí NO se usa: el
 * éxito es teal, el error es rojo de *estado de acción*, no de severidad clínica).
 * Montado una sola vez en el layout del dashboard. Posición consistente
 * (top-right), auto-dismiss sensato, accesible (role/aria los aporta sonner).
 *
 * Estilos vía CSS vars de sonner (`--normal-bg`, etc.) + un bloque en globals.css
 * (`[data-sonner-toaster]`) para tipografía e iconos.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      gap={10}
      offset={20}
      duration={4200}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast: "gvg-toast",
        },
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--fg)",
          "--normal-border": "var(--border-strong)",
          "--border-radius": "var(--radius-lg)",
          "--font-family": "var(--font-sans)",
        } as React.CSSProperties
      }
    />
  );
}
