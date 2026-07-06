"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import AlertBell from "@/components/shell/AlertBell";

/**
 * Topbar del shell (UX-1).
 * - Buscador global de pacientes con atajo "/" para enfocar. Por ahora, al
 *   submitear navega a /dashboard/afiliados (el buscador real llega en F-5).
 * - Campana de alertas (AlertBell) con badge por severidad.
 * - Botón hamburguesa para colapsar la sidebar (controlado por el layout).
 */
export default function Topbar({
  onToggleSidebar,
}: {
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo global "/" → foco en el buscador (no dispara dentro de inputs/textareas)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = document.activeElement;
      const tag = el?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (el as HTMLElement | null)?.isContentEditable;
      if (isTyping) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(F-5): reemplazar por la búsqueda global real de personas
    // (SearchableSelectRemote / página de resultados). Por ahora navega al
    // listado de afiliados llevando el término como query param.
    const q = query.trim();
    router.push(q ? `/dashboard/afiliados?q=${encodeURIComponent(q)}` : "/dashboard/afiliados");
  };

  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const rolLabel =
    user?.rol === "superadmin"
      ? "Superadmin"
      : user?.rol === "admin"
        ? "Admin"
        : "Usuario";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--topbar-bg)] px-4">
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Colapsar menú"
          className="flex size-9 items-center justify-center rounded-md text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          <Menu className="size-5" />
        </button>
      )}

      {/* Buscador global de pacientes */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-md" role="search">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-subtle)]"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paciente…"
          aria-label="Buscar paciente"
          className={cn(
            "h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] pl-8 pr-9 text-sm text-[var(--fg)]",
            "placeholder:text-[var(--fg-subtle)] outline-none transition-[border-color,box-shadow,background-color] duration-150",
            "hover:border-[var(--border-strong)] focus-visible:border-[var(--primary-600)] focus-visible:bg-[var(--surface)]",
            "focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--primary-600)_18%,transparent)]"
          )}
        />
        {/* Hint del atajo "/" */}
        <kbd
          className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none rounded border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--fg-subtle)] sm:block"
          aria-hidden
        >
          /
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <AlertBell />

        <div className="mx-1 h-6 w-px bg-[var(--border)]" aria-hidden />

        {/* Identidad del usuario (menú completo llega con UX posteriores) */}
        <div className="flex items-center gap-2 pl-0.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--primary-600)] text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium text-[var(--fg)]">{user?.nombre}</p>
            <p className="text-xs text-[var(--fg-subtle)]">{rolLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
