"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  FilePlus2,
  FolderOpen,
  Users,
  BarChart3,
  ClipboardList,
  LogOut,
  Bell,
  Heart,
  Link2,
  FileText,
  SlidersHorizontal,
  Building2,
  Landmark,
  UserRound,
  UsersRound,
  Stethoscope,
  FileBarChart2,
  PieChart,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { administradoraService } from "@/services/administradoraService";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type MenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  section: "main" | "gestion" | "certificados" | "catalogos";
};

const SECTION_LABELS: Record<MenuItem["section"], string> = {
  main: "Principal",
  gestion: "Gestión",
  certificados: "Certificados",
  catalogos: "Catálogos",
};

/**
 * Sidebar del shell (UX-1). Se conservan EXACTAMENTE los mismos items/hrefs por
 * rol (solo cambia la piel: tokens del design system, agrupación por secciones,
 * estado activo claro y modo colapsable icon-only). Íconos migrados a Lucide.
 */
export default function Sidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // UX-10: nombre del tenant junto al logo, reemplaza el genérico "Sistema de
  // gestión". Superadmin (sin administradoraId) → nombre de la marca propia.
  // Mientras carga o si falla, no se muestra nada (evita flicker de texto genérico).
  const [fetchedTenantName, setFetchedTenantName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.administradoraId) return;
    let cancelled = false;
    administradoraService
      .getById(user.administradoraId)
      .then((administradora) => {
        if (!cancelled) setFetchedTenantName(administradora.nombre);
      })
      .catch(() => {
        if (!cancelled) setFetchedTenantName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.administradoraId]);

  const tenantName = !user
    ? null
    : !user.administradoraId
      ? "GV-G Consulting"
      : fetchedTenantName;

  const userMenuItems: MenuItem[] = [
    { name: "Inicio", href: "/dashboard", icon: Home, section: "main" },
    { name: "Alertas", href: "/dashboard/alerts", icon: Bell, section: "main" },
    { name: "Nuevo Afiliado/Certificado", href: "/dashboard/upload", icon: FilePlus2, section: "main" },
    { name: "Mis Certificados", href: "/dashboard/certificates", icon: FolderOpen, section: "main" },
  ];

  // Menú Superadmin (acceso completo)
  const superAdminMenuItems: MenuItem[] = [
    { name: "Inicio", href: "/dashboard", icon: Home, section: "main" },
    { name: "Alertas", href: "/dashboard/alerts", icon: Bell, section: "main" },
    { name: "Reportes", href: "/dashboard/reportes", icon: FileBarChart2, section: "main" },
    { name: "Métricas", href: "/dashboard/metrics", icon: PieChart, section: "main" },

    { name: "Afiliados", href: "/dashboard/afiliados", icon: UserRound, section: "gestion" },
    { name: "Adherentes", href: "/dashboard/adherentes", icon: UsersRound, section: "gestion" },
    { name: "Terceros Vinculados", href: "/dashboard/profesionales", icon: Stethoscope, section: "gestion" },

    { name: "Certificados Discapacidad", href: "/dashboard/certificados-discapacidad", icon: FileText, section: "certificados" },
    { name: "Certificados", href: "/dashboard/certificates", icon: FolderOpen, section: "certificados" },

    { name: "Estado Civil", href: "/dashboard/estado-civil", icon: Heart, section: "catalogos" },
    { name: "Tipos de Discapacidad", href: "/dashboard/tipo-discapacidad", icon: SlidersHorizontal, section: "catalogos" },
    { name: "Categorías", href: "/dashboard/categories", icon: ClipboardList, section: "catalogos" },
    { name: "Nomencladores", href: "/dashboard/nomenclators", icon: BarChart3, section: "catalogos" },
    { name: "Servicios", href: "/dashboard/servicios", icon: SlidersHorizontal, section: "catalogos" },
    { name: "Servicios No Nomenclados", href: "/dashboard/servicios-no-nomenclados", icon: FileText, section: "catalogos" },
    { name: "Efectores", href: "/dashboard/efectores", icon: Building2, section: "catalogos" },
    { name: "Prestadores", href: "/dashboard/prestadores", icon: Users, section: "catalogos" },
    { name: "Orientación Prestacional", href: "/dashboard/orientacion-prestacional", icon: Link2, section: "catalogos" },
    { name: "Obras Sociales", href: "/dashboard/obras-sociales", icon: Landmark, section: "catalogos" },
  ];

  // Menú Admin de Obra Social (con Reportes; sin acceso a Configuración global)
  const adminObraSocialMenuItems: MenuItem[] = [
    { name: "Inicio", href: "/dashboard", icon: Home, section: "main" },
    { name: "Alertas", href: "/dashboard/alerts", icon: Bell, section: "main" },
    { name: "Reportes", href: "/dashboard/reportes", icon: FileBarChart2, section: "main" },

    { name: "Afiliados", href: "/dashboard/afiliados", icon: UserRound, section: "gestion" },
    { name: "Adherentes", href: "/dashboard/adherentes", icon: UsersRound, section: "gestion" },
    { name: "Terceros Vinculados", href: "/dashboard/profesionales", icon: Stethoscope, section: "gestion" },

    { name: "Certificados Discapacidad", href: "/dashboard/certificados-discapacidad", icon: FileText, section: "certificados" },
    { name: "Certificados", href: "/dashboard/certificates", icon: FolderOpen, section: "certificados" },

    { name: "Estado Civil", href: "/dashboard/estado-civil", icon: Heart, section: "catalogos" },
    { name: "Tipos de Discapacidad", href: "/dashboard/tipo-discapacidad", icon: SlidersHorizontal, section: "catalogos" },
    { name: "Categorías", href: "/dashboard/categories", icon: ClipboardList, section: "catalogos" },
    { name: "Nomencladores", href: "/dashboard/nomenclators", icon: BarChart3, section: "catalogos" },
    { name: "Servicios", href: "/dashboard/servicios", icon: SlidersHorizontal, section: "catalogos" },
    { name: "Servicios No Nomenclados", href: "/dashboard/servicios-no-nomenclados", icon: FileText, section: "catalogos" },
    { name: "Efectores", href: "/dashboard/efectores", icon: Building2, section: "catalogos" },
    { name: "Prestadores", href: "/dashboard/prestadores", icon: Users, section: "catalogos" },
    { name: "Orientación Prestacional", href: "/dashboard/orientacion-prestacional", icon: Link2, section: "catalogos" },
    { name: "Obras Sociales", href: "/dashboard/obras-sociales", icon: Landmark, section: "catalogos" },
  ];

  const menuItems = isSuperAdmin
    ? superAdminMenuItems
    : isAdmin
      ? adminObraSocialMenuItems
      : userMenuItems;

  const isPrivileged = isAdmin || isSuperAdmin;
  const sectionOrder: MenuItem["section"][] = isPrivileged
    ? ["main", "gestion", "certificados", "catalogos"]
    : ["main"];

  const renderItem = (item: MenuItem) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const isAlerts = item.href === "/dashboard/alerts";

    const link = (
      <Link
        key={item.name}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        title={collapsed ? item.name : undefined}
        className={cn(
          "group relative flex items-center rounded-md text-sm transition-colors duration-150",
          collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
          isActive
            ? "bg-[var(--sidebar-active-bg)] font-medium text-white"
            : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover-bg)] hover:text-white"
        )}
      >
        {/* Barra de estado activo a la izquierda (grid-break sutil) */}
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white/80" />
        )}
        <span className="relative shrink-0">
          <Icon className="size-[18px]" />
          {isAlerts && (
            <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[var(--sev-critica)]" />
          )}
        </span>
        {!collapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-[var(--neutral-800)] bg-[var(--sidebar-bg)] transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Marca — logo real GV-G (variante blanca para el panel oscuro) */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-[var(--neutral-800)]",
          collapsed ? "justify-center px-1" : "gap-2.5 px-4"
        )}
      >
        {/* The brand PNGs are square with internal padding; constrain by height
            and let width follow to keep the mark crisp. */}
        <Image
          src="/logo-gvg-footer.png"
          alt="GV-G Consulting"
          width={512}
          height={512}
          priority
          className={cn("w-auto object-contain", collapsed ? "h-10" : "h-12")}
        />
        {!collapsed && tenantName && (
          <p className="truncate text-[12px] font-bold uppercase tracking-wider text-[var(--sidebar-section-fg)]">
            {tenantName}
          </p>
        )}
      </div>

      {/* Navegación agrupada */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {sectionOrder.map((section, idx) => {
          const items = menuItems.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section} className={cn(idx > 0 && "mt-5")}>
              {!collapsed && (
                <p className="mb-1.5 flex items-center gap-2 px-3 text-[12px] font-bold uppercase tracking-wider text-[var(--sidebar-section-fg)]">
                  {SECTION_LABELS[section]}
                  <span className="h-px flex-1 bg-[color-mix(in_srgb,var(--sidebar-section-fg)_35%,transparent)]" aria-hidden />
                </p>
              )}
              {collapsed && idx > 0 && (
                <div className="mx-2 mb-2 h-px bg-[var(--neutral-800)]" aria-hidden />
              )}
              <div className="space-y-0.5">{items.map(renderItem)}</div>
            </div>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="shrink-0 border-t border-[var(--neutral-800)] p-2.5">
        <button
          onClick={handleLogout}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "group flex w-full items-center rounded-md text-sm text-[var(--sidebar-fg)] transition-colors duration-150",
            "hover:bg-[color-mix(in_srgb,var(--sev-critica)_16%,transparent)] hover:text-[#fca5a5]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
