# DESIGN.md — GV-G Consulting (Design System · UX-1)

Sistema de diseño del frontend. **Toda pantalla nueva o retocada respeta este
documento.** Ninguna pantalla usa colores, espaciados, radios o tipografías
fuera de estos tokens.

> Regla madre (05-ux-spec.md): **sobrio, denso con jerarquía, desktop-first,
> teclado-first.** Salud = confianza; cero efectos gratuitos. El sistema
> recomienda, el usuario confirma.

Stack: Next 16 · React 19 · Tailwind v4 (config en CSS, sin `tailwind.config`) ·
shadcn/ui (retematizado con nuestros tokens) · Lucide (shell nuevo) · Recharts.

---

## 1. Filosofía

- **Denso con diseño (U7):** tablas compactas, números tabulares, header sticky,
  zebra sutil — pero cada dato con su peso visual. Densidad por diseño, no por
  amontonamiento. Sin toggle de densidad: se resuelve con buen diseño.
- **Identidad propia sobria (U6):** teal profundo de salud, no el azul admin
  genérico. Neutrales cálidos, no gris muerto.
- **El semáforo manda (RN-11):** rojo/ámbar/verde tiene UN único significado
  (severidad de alerta) y se ve idéntico en campana, bandeja, inicio, tablas y
  fichas. **Nunca decorativo.**
- **Teclado-first:** foco visible en todo elemento interactivo; atajo `/` enfoca
  la búsqueda global. Contraste AA.
- **Motion sobrio:** transiciones 150–250ms, easing expo. Respeta
  `prefers-reduced-motion`. Un solo "moment" con carácter: el pulso de la campana
  al subir la severidad máxima.

---

## 2. Color — Tokens

Definidos en `src/app/globals.css`. Fuente única de verdad.

### 2.1 Primary — Teal profundo de salud (identidad)

Reemplaza el viejo *Admindek Blue*. `--primary-600` = color principal de marca.

| Token | Hex | Uso |
|---|---|---|
| `--primary-50`  | `#ecfdf9` | fondos suaves, chips |
| `--primary-100` | `#d0faf0` | hover de fondos suaves |
| `--primary-200` | `#a4f2e1` | bordes teñidos |
| `--primary-300` | `#6ee3ce` | — |
| `--primary-400` | `#34ccb4` | — |
| `--primary-500` | `#16a394` | acento vivo, hover claro |
| **`--primary-600`** | **`#0f766e`** | **MAIN — botones, activos, foco** |
| `--primary-700` | `#115e57` | hover de botón primario |
| `--primary-800` | `#134e49` | active de botón |
| `--primary-900` | `#134039` | sidebar tinta, texto teal |
| `--primary-950` | `#042f2a` | — |

Disponible como utilidades `primary-N` (`bg-primary-600`, `text-primary-700`, …).

### 2.2 Neutrales cálidos

Piedra/stone con una pizca de temperatura. Reemplazan el gris frío default de
Tailwind (`neutral-*` está sobrescrito).

| Token | Hex | Uso |
|---|---|---|
| `--neutral-50`  | `#faf9f7` | fondo de página |
| `--neutral-100` | `#f4f2ee` | superficie hundida, header de tabla |
| `--neutral-200` | `#e8e5df` | bordes / hairlines |
| `--neutral-300` | `#d6d1c7` | bordes fuertes, scrollbar |
| `--neutral-400` | `#a8a196` | placeholder, íconos apagados |
| `--neutral-500` | `#7c766b` | texto sutil |
| `--neutral-600` | `#5c574e` | texto secundario |
| `--neutral-700` | `#443f38` | — |
| `--neutral-800` | `#2b2823` | bordes del sidebar |
| `--neutral-900` | `#1c1a16` | texto primario, fondo del sidebar |

### 2.3 Semáforo de severidad (RN-11) — USO EXCLUSIVO

Rojo/ámbar/verde **solo** para prioridad de alerta. Cada tono trae `-bg` (fondo
suave del badge) y `-fg` (texto del badge).

| Prioridad | Tono | solid | bg | fg |
|---|---|---|---|---|
| CRITICA / ALTA | `critica` (rojo) | `--sev-critica` `#dc2626` | `--sev-critica-bg` `#fef2f2` | `--sev-critica-fg` `#991b1b` |
| MEDIA | `media` (ámbar) | `--sev-media` `#d97706` | `--sev-media-bg` `#fffbeb` | `--sev-media-fg` `#92400e` |
| BAJA / INFO | `baja` (verde) | `--sev-baja` `#16a34a` | `--sev-baja-bg` `#f0fdf4` | `--sev-baja-fg` `#166534` |

**Nunca** usar estos colores con otro significado (ni éxito genérico, ni acento).
El mapeo prioridad→tono vive en `src/lib/severity.ts` (`priorityToTone`,
`maxToneFromCounts`, `maxTone`). Usar SIEMPRE ese helper — no re-implementar.

### 2.4 Tokens semánticos (preferir estos en componentes nuevos)

| Token | Referencia | Uso |
|---|---|---|
| `--bg` | neutral-50 | fondo de la app |
| `--surface` | white | cards, tablas, modales |
| `--surface-sunken` | neutral-100 | header de tabla, zonas hundidas |
| `--border` | neutral-200 | hairlines |
| `--border-strong` | neutral-300 | bordes de inputs |
| `--fg` | neutral-900 | texto primario |
| `--fg-muted` | neutral-600 | texto secundario |
| `--fg-subtle` | neutral-500 | placeholder, hints |
| `--ring` | primary-600 | anillo de foco |

En clases: `bg-surface`, `text-fg-muted`, `border-border`, o arbitrary
`bg-[var(--surface)]`.

---

## 3. Tipografía

**Fuente: `Lexend Variable`** (self-hosted vía `@fontsource-variable/lexend`, sin
CDN). Elegida por ser una **sans humanista diseñada para eficiencia de lectura**
— ideal para datos densos, con carácter propio. **No Inter, no Geist** (los tells
de template). Cargada en `src/app/layout.tsx`; expuesta como `--font-sans`.

Escala (definida en `globals.css`, base 14px por densidad admin):

| Elemento | Tamaño | Peso | Notas |
|---|---|---|---|
| h1 | 1.75rem | 600 | tracking -0.011em |
| h2 | 1.375rem | 600 | |
| h3 | 1.125rem | 600 | |
| body / `p` | 14px | 400 | line-height 1.6 |
| label / th | 12px | 600 | uppercase tracking-wide en headers |

### Números tabulares — OBLIGATORIO

Clase utilitaria **`.tabular-nums`** (`font-variant-numeric: tabular-nums`).
Aplicar en TODA celda numérica: DNI, CUIL, carnets, números de afiliado,
importes, contadores, badges de conteo, fechas en columnas. Evita saltos de
layout y alinea dígitos. En `<DataTable>` se activa por columna con `numeric: true`.

---

## 4. Radios, sombras, espaciado, motion

**Radios** (crisp, no `rounded-2xl` en todo):
`--radius-sm` 4px (chips/badges) · `--radius-md` 6px (inputs/botones/celdas) ·
`--radius-lg` 8px (cards/modales) · `--radius-xl` 12px (superficies grandes).

**Sombras** (planas + una elevación considerada):
`--shadow-sm` (cards en reposo) · `--shadow-md` (hover) · `--shadow-lg`
(dropdowns/tooltips) · `--shadow-2xl` (sheet/dialog).

**Espaciado:** ritmo 4/8px de Tailwind. Contenido del dashboard con padding
`p-6 lg:p-8`. Filas de tabla ~40px (`h-10`), header ~36px (`h-9`).

**Motion:** `--transition-fast` 150ms · `--transition-base` 200ms ·
`--transition-slow` 250ms, todas con easing expo `cubic-bezier(0.16,1,0.3,1)`.
Animaciones disponibles: `.fade-in`, `.slide-in-right`, `.animate-sheet-in`,
`.animate-overlay-in`, `.animate-bell-ping`, `.skeleton` (shimmer),
`.animate-shake`. Todas respetan `prefers-reduced-motion`.

---

## 5. Componentes disponibles

### 5.1 shadcn/ui (retematizados) — `src/components/ui/`

Instalados manualmente y estilados con NUESTROS tokens (no el look default).
Estilo base `new-york`, config en `components.json`.

| Componente | Archivo | Notas |
|---|---|---|
| `Button` | `ui/button.tsx` | variantes: default (teal), outline, ghost, subtle, destructive, link. Tamaños sm/default/lg/icon. |
| `Input` | `ui/input.tsx` | foco anillo teal; `aria-invalid` → borde/fondo rojo. Sumar `tabular-nums` para DNI/importes. |
| `Badge` | `ui/badge.tsx` | variantes default/secondary/outline + **critica/media/baja** (semáforo RN-11). |
| `Sheet` | `ui/sheet.tsx` | panel lateral (bandeja de alertas). Radix Dialog. |
| `Dialog` | `ui/dialog.tsx` | modal centrado. |
| `Tooltip` | `ui/tooltip.tsx` | delay 200ms, tinta oscura. |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | menús de acción/usuario. |
| `Table` (primitivos) | `ui/table.tsx` | header sticky, zebra, celdas densas. Preferir `DataTable`. |

### 5.2 `DataTable` — tabla densa del design system (UX-7)

`src/components/ui/data-table.tsx`. **Componente de tabla único** que consumen las
pantallas nuevas. Genérico y tipado.

- Filas ~40px, header sticky, zebra sutil, `tabular-nums` por columna
  (`numeric: true`).
- Slot de búsqueda arriba-izquierda (controlado por el padre — el padre aplica el
  debounce 300ms + fetch), toolbar a la derecha (chips de semáforo, "Nuevo").
- Estados: **skeleton** (loading), **vacío diseñado** (ícono + copy + CTA).
- **Paginación pluggable** (pasar `<Pagination />` server o client-side).
- `onRowClick` para abrir detalle.

Uso mínimo:

```tsx
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

type Persona = { id: string; apellido: string; nombre: string; dni: string };

const columns: DataTableColumn<Persona>[] = [
  { id: "apellido", header: "Apellido y Nombre",
    cell: (p) => `${p.apellido}, ${p.nombre}` },
  { id: "dni", header: "DNI", cell: (p) => p.dni, numeric: true, align: "right" },
];

<DataTable
  columns={columns}
  data={pageItems}
  getRowId={(p) => p.id}
  loading={loading}
  searchable
  searchValue={q}
  onSearchChange={setQ}                 // el padre debounce + fetch (server-side)
  searchPlaceholder="Buscar paciente…"
  onRowClick={(p) => router.push(`/dashboard/personas/${p.id}`)}
  pagination={<Pagination {...paginationProps} />}
  emptyTitle="Sin pacientes"
  emptyDescription="Cargá el primero para empezar."
  emptyAction={<Button onClick={openNew}>Nueva persona</Button>}
/>
```

### 5.3 Shell — `src/components/shell/` + `src/components/Sidebar.tsx`

- **`Sidebar.tsx`** — sidebar sobre tokens: secciones agrupadas y etiquetadas
  (Principal / Gestión / Certificados / Catálogos / Config), estado activo claro
  (fondo teal + barra lateral), colapsable (icon-only con tooltips), persiste el
  colapso en localStorage (`sidebar:collapsed`). **Mismos items/hrefs por rol
  que antes** — solo cambió la piel y la agrupación.
- **`shell/Topbar.tsx`** — buscador global de pacientes (atajo `/` para enfocar;
  al submitear navega a `/dashboard/afiliados` — el buscador real llega en F-5,
  marcado con `TODO`), campana de alertas, identidad del usuario.
- **`shell/AlertBell.tsx`** — campana con badge del total PENDIENTE coloreado por
  severidad máxima (RN-11); refetch cada 60s de `alertasService.getDashboard()`;
  click abre un `Sheet` con las últimas alertas (color, título, persona, hace
  cuánto) y link "Ver todas" a `/dashboard/alerts`. Pulso único al subir la
  severidad. **Versión básica — la gestión inline llega en UX-4.**

### 5.4 Helpers

- `src/lib/severity.ts` — mapeo prioridad→semáforo (RN-11). **Fuente única.**
- `src/lib/timeAgo.ts` — "hace cuánto" en español, compacto.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).

---

## 6. Iconos

- **Shell nuevo → Lucide** (`lucide-react`). Trazo consistente, tamaño 18px en
  navegación / 16–20px en acciones.
- **Páginas legacy → Heroicons** (`@heroicons/react`), hasta que se reconstruyan
  en la Ola 2. **No mezclar dos familias en una misma pantalla nueva:** toda
  pantalla nueva usa Lucide.

---

## 7. Legacy y migración

### Qué queda legacy (muere en Ola 2)
- Páginas CRUD actuales (`afiliados`, `aderentes`, `terceros-vinculados`,
  `persona-terceros`, `diagnosticos`, catálogos, etc.) conservan su JSX y sus
  **Heroicons**. Se reconstruyen sobre este design system en la Ola 2.
- Clases legacy retintadas que se mantienen por compat: `.premium-card`,
  `.btn-primary`, `.btn-secondary`, `.input-premium`, `.text-muted`,
  `.text-light`. Ya apuntan al teal — no crear nuevas; usar los componentes de
  `ui/`.

### Cómo NO se rompió nada (clave del re-tema)
Las páginas viejas usan DOS sistemas de color:
1. Escala `--primary-N` (CSS vars) → re-apuntada a teal en `globals.css`.
2. Utilidades `blue-*` **hardcodeadas** de Tailwind (`bg-blue-600`,
   `text-blue-600`, `ring-blue-500`, …) en ~27 archivos.

Para el (2) se **re-mapeó la paleta `blue-*` de Tailwind → teal** en un bloque
`@theme` (no-inline) de `globals.css`. Así esas páginas adoptan la identidad
**sin tocar su JSX**. Idem `neutral-*` (frío default → cálido).

### Regla de migración al reconstruir una pantalla (Ola 2)
1. Reemplazar `bg-blue-*` / `focus:ring-primary-500` ad-hoc por componentes
   `ui/` (`Button`, `Input`) o utilidades de token (`bg-primary-600`, `bg-surface`).
2. Migrar sus iconos Heroicons → Lucide.
3. Reemplazar la tabla ad-hoc por `<DataTable>`.
4. Aplicar `.tabular-nums` a toda columna numérica.
5. Semáforo solo vía `severity.ts`.

---

## 8. Checklist de "hecho" para una pantalla

- [ ] Ningún color/espaciado/radio fuera de tokens.
- [ ] Semáforo (rojo/ámbar/verde) solo para severidad, vía `severity.ts`.
- [ ] `tabular-nums` en DNI/carnets/importes/contadores/fechas.
- [ ] Foco visible en todo interactivo; contraste AA; `Enter` no submitea forms.
- [ ] Iconos Lucide (pantalla nueva); una sola familia.
- [ ] Estados vacío y skeleton diseñados (usar `DataTable`).
- [ ] Transiciones 150–250ms; `prefers-reduced-motion` respetado.
- [ ] Sin `console.log`.
