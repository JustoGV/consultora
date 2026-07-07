# DESIGN.md — GV-G Consulting (Design System · UX-7b)

Sistema de diseño del frontend, alineado a la **identidad real de marca GV-G
Consulting**: editorial, cyan de acento sobre tinta azul profunda, tipografía
serif/sans/mono y **radius 0 en todo**. La misma familia visual del login y de la
web pública.

> Regla madre: **sobrio, denso con jerarquía, desktop-first, teclado-first.**
> Salud = confianza; cero efectos gratuitos. El sistema recomienda, el usuario
> confirma. La marca habla con voz editorial (Fraunces + cyan), no con el look
> genérico de un admin template.

Stack: Next 16 · React 19 · Tailwind v4 (config en CSS, sin `tailwind.config`) ·
shadcn/ui (retematizado con nuestros tokens) · Lucide (shell) · Recharts.

**Toda pantalla nueva o retocada respeta este documento.** Ninguna pantalla usa
colores, espaciados, radios o tipografías fuera de estos tokens.

---

## 1. Filosofía

- **Identidad editorial GV-G (marca real):** cyan de acento (`#07b6d5`) sobre
  tinta azul profunda, blanco de canvas, reglas de 1px, **radius 0**, sombra
  editorial suave. Titulares en Fraunces (serif) con énfasis en itálica cyan.
  Eyebrows y metadata en JetBrains Mono. Es la voz del login y de la web pública.
- **El cyan NO es para texto:** el cyan puro no alcanza contraste AA sobre blanco.
  Se reserva para **fills, líneas de acento, hover y estados**. Para
  **texto/links/foco** se usa el cyan oscuro (`accent-ink` = `--primary-600`),
  que sí pasa AA.
- **Denso con diseño:** tablas compactas, números tabulares (mono), header
  sticky, zebra sutil — cada dato con su peso visual. Densidad por diseño, no por
  amontonamiento.
- **El semáforo manda (RN-11):** rojo/ámbar/verde tiene UN único significado
  (severidad de alerta) y se ve idéntico en campana, bandeja, inicio, tablas y
  fichas. **Nunca decorativo.** Los tonos están levemente enfriados para convivir
  con el cyan sin perder el código inconfundible.
- **Teclado-first:** foco visible (anillo cyan-ink) en todo interactivo; atajo
  `/` enfoca la búsqueda global. Contraste AA.
- **Motion editorial:** transiciones 250–450ms con easing de marca
  `cubic-bezier(0.22,1,0.36,1)`. Respeta `prefers-reduced-motion`. Un solo
  "moment" con carácter: el pulso de la campana al subir la severidad máxima.

---

## 2. Color — Tokens

Definidos en `src/app/globals.css`. Fuente única de verdad. Los **nombres** de
las escalas (`--primary-N`, `--neutral-N`) se conservan del sistema anterior para
que las páginas que las referencian adopten la marca **sin tocar su JSX**; solo
cambiaron los valores.

### 2.1 Cyan de marca — escala `--primary` (identidad GV-G)

La escala drifta de **cyan brillante** (fills/líneas) a **tinta azul profunda**
(texto/botones AA). `--primary-600` = *accent-ink*: color de texto/link/botón
principal.

| Token | Hex | Uso |
|---|---|---|
| `--primary-50`  | `#eefafb` | fondos suaves, chips (accent-wash) |
| `--primary-100` | `#d4f3f7` | hover de fondos suaves (accent-soft) |
| `--primary-200` | `#aae5ee` | bordes teñidos |
| `--primary-300` | `#51d4ec` | — |
| `--primary-400` | `#0dd0f2` | hover de fills (accent-bright) |
| **`--primary-500`** | **`#07b6d5`** | **CYAN puro — fills, líneas de acento, underline-grow, glow** |
| **`--primary-600`** | **`#0d7791`** | **MAIN texto/link/botón — accent-ink (AA 5.17 sobre blanco)** |
| `--primary-700` | `#145571` | hover de botón / texto acento intenso (AA 8.18) |
| `--primary-800` | `#193c57` | active de botón |
| `--primary-900` | `#243a52` | navy — tintas profundas |
| `--primary-950` | `#131d2a` | — |

Alias semánticos de marca (paridad con el login): `--accent` `#07b6d5`,
`--accent-bright` `#0dd0f2`, `--accent-ink` `#0d7791`, `--accent-soft` `#cbf0f6`,
`--accent-wash` `#e6f7fa`. Disponibles como utilidades (`bg-accent`,
`text-accent-ink`, `bg-accent-wash`, …) y como `primary-N` (`bg-primary-600`, …).

> **Regla de contraste:** para **texto y links** sobre blanco usar `accent-ink`
> (`--primary-600/700`). El cyan puro (`--accent` / `--primary-500`) solo en
> **fills, bordes, líneas y estados hover** — nunca como color de texto sobre
> claro.

### 2.2 Neutrales — tinta azul fría de marca

Gris azulado frío (tinta/regla), no el stone cálido anterior. Reemplazan el
neutral default de Tailwind (`neutral-*` está sobrescrito).

| Token | Hex | Uso |
|---|---|---|
| `--neutral-50`  | `#f5f7fa` | fondo de página (paper) |
| `--neutral-100` | `#eef2f7` | superficie hundida, header de tabla |
| `--neutral-200` | `#d9e2ed` | rule — hairlines |
| `--neutral-300` | `#bccbdc` | rule-strong — bordes de inputs, scrollbar |
| `--neutral-400` | `#8298b0` | placeholder, íconos apagados |
| `--neutral-500` | `#607c9a` | dim — texto sutil (AA 4.33) |
| `--neutral-600` | `#334c66` | ink-soft — texto secundario (AA 8.87) |
| `--neutral-700` | `#25374b` | — |
| `--neutral-800` | `#1b2736` | bordes del sidebar |
| `--neutral-900` | `#1a2532` | ink — texto primario |
| `--neutral-950` | `#0e1620` | ink-deep — fondo del sidebar |

### 2.3 Semáforo de severidad (RN-11) — USO EXCLUSIVO

Rojo/ámbar/verde **solo** para prioridad de alerta. Tonos levemente enfriados
para convivir con el cyan sin perder el código inconfundible. Cada tono trae
`-bg` (fondo suave del badge) y `-fg` (texto del badge).

| Prioridad | Tono | solid | bg | fg |
|---|---|---|---|---|
| CRITICA / ALTA | `critica` (rojo) | `--sev-critica` `#e0393b` | `--sev-critica-bg` `#fef2f2` | `--sev-critica-fg` `#9f1d1d` |
| MEDIA | `media` (ámbar) | `--sev-media` `#d98324` | `--sev-media-bg` `#fdf6ec` | `--sev-media-fg` `#8a4d0f` |
| BAJA / INFO | `baja` (verde) | `--sev-baja` `#1a9e6a` | `--sev-baja-bg` `#eefaf3` | `--sev-baja-fg` `#10603f` |

**Nunca** usar estos colores con otro significado (ni éxito genérico, ni acento —
para acento está el cyan). El mapeo prioridad→tono vive en `src/lib/severity.ts`
(`priorityToTone`, `maxToneFromCounts`, `maxTone`). Usar SIEMPRE ese helper.

### 2.4 Tokens semánticos (preferir estos en componentes nuevos)

| Token | Referencia | Uso |
|---|---|---|
| `--bg` | neutral-50 | fondo de la app |
| `--surface` | white | cards, tablas, modales |
| `--surface-sunken` | neutral-100 | header de tabla, zonas hundidas |
| `--border` | neutral-200 | hairlines (rule 1px) |
| `--border-strong` | neutral-300 | bordes de inputs |
| `--fg` | neutral-900 | texto primario |
| `--fg-muted` | neutral-600 | texto secundario (AA) |
| `--fg-subtle` | neutral-500 | placeholder, hints |
| `--ring` | accent-ink | anillo de foco (cyan-ink, AA) |

En clases: `bg-surface`, `text-fg-muted`, `border-border`, o arbitrary
`bg-[var(--surface)]`.

### 2.5 Shell (sidebar ink-deep)

| Token | Valor | Uso |
|---|---|---|
| `--sidebar-bg` | neutral-950 (ink-deep) | fondo del sidebar |
| `--sidebar-fg` | `#a9bace` | texto de navegación (AA sobre ink-deep) |
| `--sidebar-fg-muted` | `#64788f` | labels de sección |
| `--sidebar-active-bg` | accent-ink | fondo del item activo |
| `--sidebar-active-fg` | white | texto del item activo |
| `--sidebar-hover-bg` | neutral-800 | hover de item |

**Decisión — sidebar oscuro (ink-deep):** en una app densa de uso diario, un
frame oscuro ancla la cromática, reduce la competencia visual con el canvas
blanco de contenido y **replica el panel de marca del login**. El estado activo
va en cyan-ink con una **línea de acento cyan** a la izquierda. Un sidebar claro
sobre canvas claro difuminaría el límite chrome/contenido y exigiría reglas más
pesadas.

---

## 3. Tipografía

Tres voces de marca, cargadas en `src/app/layout.tsx` vía `next/font/google`
(self-hosted, sin CDN) y expuestas como variables CSS. **Reemplazan a Lexend.**

| Rol | Fuente | Variable | Uso |
|---|---|---|---|
| **Display** | **Fraunces** (serif) | `--font-display` (`--font-fraunces`) | títulos de página, h1–h6, títulos de card/modal/sheet. Peso 300–500; **itálica cyan** para énfasis. |
| **UI / body** | **Inter** (sans) | `--font-sans` (`--font-inter`) | cuerpo, controles, tablas, labels de formulario. Voz por defecto. |
| **Meta / números** | **JetBrains Mono** | `--font-mono` (`--font-jetbrains`) | eyebrows uppercase, metadata, badges numéricos, `.tabular-nums`. |

`h1..h6` mapean a Fraunces automáticamente en `globals.css` (peso 400, tracking
`-0.02em`, `line-height` apretado). Énfasis en itálica dentro de titulares
(`h1 em`) → itálica cyan (`accent-ink`).

### Utilidades tipográficas

- **`.font-display`** — fuerza Fraunces + tracking editorial (para h1 de página
  vía clase explícita).
- **`.eyebrow`** — etiqueta mono uppercase, `letter-spacing: 0.18em`, tamaño
  0.6875rem. La etiqueta superior de la marca (ej. "PANEL · LO URGENTE DEL DÍA").
- **`.mono-meta`** — metadata mono con tracking medio (créditos, versiones).
- **`.tabular-nums`** — `font-variant-numeric: tabular-nums`. **OBLIGATORIO** en
  DNI, CUIL, carnets, números de afiliado, importes, contadores, fechas en
  columnas. En `<DataTable>` se activa por columna con `numeric: true`.

### Escala (base 14px por densidad admin, definida en `globals.css`)

| Elemento | Tamaño | Fuente | Notas |
|---|---|---|---|
| h1 (título de página) | 1.875rem | Fraunces 400 | usar `.font-display`; puede subir a `text-[2rem]` |
| h2 | 1.5rem | Fraunces 400 | títulos de sección/card |
| h3 | 1.25rem | Fraunces 400 | |
| eyebrow | 0.6875rem | Mono 500 | uppercase, tracking 0.18em, cyan-ink |
| body / `p` | 14px | Inter 400 | line-height 1.6 |
| label / th | 12px | Inter 500–600 | uppercase tracking-wide en headers |

---

## 4. Radios, sombras, espaciado, motion

**Radios — RADIUS 0 EN TODO (identidad editorial GV-G).**
`--radius-sm/md/lg/xl` = **0** (los nombres se conservan; todos valen 0, así
ningún `rounded-*` del design system redondea). También se anulan a 0 los radios
built-in de Tailwind (`rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, …).
**Pills genuinas** (badge de conteo de la campana, dots de estado, spinners,
avatares circulares) usan `rounded-full` explícito y son la única excepción, solo
cuando la forma lo exige funcionalmente. Los coins de ícono de estados vacíos van
**cuadrados con borde de 1px**, no circulares.

**Sombras — editoriales** (plana suave + una elevación con profundidad):
`--shadow-sm` (cards en reposo, `0 1px 2px ink/.05`) · `--shadow-md` (hover) ·
`--shadow-lg` (dropdowns/tooltips) · `--shadow-2xl` (sheet/dialog,
`0 24px 60px -30px ink/.22`). `--shadow-editorial` = la sombra de marca del login
(`0 24px 60px -30px ink/.18`) para cards de énfasis.

**Espaciado:** ritmo 4/8px de Tailwind. Contenido del dashboard con padding
`p-6 lg:p-8`. Filas de tabla ~40px (`h-10`), header ~36px (`h-9`).

**Motion:** easing de marca `--ease-ed` = `cubic-bezier(0.22,1,0.36,1)`.
`--transition-fast` 250ms · `--transition-base` 350ms · `--transition-slow`
450ms. Animaciones disponibles: `.fade-in`, `.slide-in-right`,
`.animate-sheet-in`, `.animate-overlay-in`, `.animate-bell-ping`, `.skeleton`
(shimmer), `.animate-shake`. Todas respetan `prefers-reduced-motion`. Patrones de
marca: **underline-grow** cyan bajo inputs al enfocar, **línea de acento** que
crece (scaleX), fill de botón que se revela de izquierda a derecha.

---

## 5. Componentes disponibles

### 5.1 shadcn/ui (retematizados) — `src/components/ui/`

Estilados con NUESTROS tokens (no el look default). Todos radius 0. Estilo base
`new-york`, config en `components.json`.

| Componente | Archivo | Notas |
|---|---|---|
| `Button` | `ui/button.tsx` | variantes: default (accent-ink), outline, ghost, subtle, destructive, link. Tamaños sm/default/lg/icon. Radius 0. |
| `Input` | `ui/input.tsx` | foco anillo cyan-ink; `aria-invalid` → borde/fondo rojo. Sumar `tabular-nums` para DNI/importes. Radius 0. |
| `Badge` | `ui/badge.tsx` | variantes default/secondary/outline + **critica/media/baja** (semáforo RN-11). Radius 0 (chip cuadrado). |
| `Sheet` | `ui/sheet.tsx` | panel lateral (bandeja de alertas). Radix Dialog. Scrim ink + blur. |
| `Dialog` | `ui/dialog.tsx` | modal centrado, sharp. Scrim ink + blur. |
| `Tooltip` | `ui/tooltip.tsx` | delay 200ms, tinta oscura. |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | menús de acción/usuario. |
| `Table` (primitivos) | `ui/table.tsx` | header sticky, zebra, celdas densas. Preferir `DataTable`. |

### 5.2 `DataTable` — tabla densa del design system (UX-7)

`src/components/ui/data-table.tsx`. **Componente de tabla único** que consumen las
pantallas nuevas. Genérico y tipado.

- Filas ~40px, header sticky, zebra sutil, `tabular-nums` por columna
  (`numeric: true`). Contenedor sharp (radius 0).
- Slot de búsqueda arriba-izquierda (controlado por el padre — el padre aplica el
  debounce 300ms + fetch), toolbar a la derecha (chips de semáforo, "Nuevo").
- Estados: **skeleton** (loading), **vacío diseñado** (coin cuadrado con borde +
  copy + CTA).
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

- **`Sidebar.tsx`** — sidebar **ink-deep** (frame editorial oscuro). Mark de marca
  con tile cyan-ink + wordmark Fraunces "GV-G Consulting" + eyebrow mono "GESTIÓN
  DE SALUD". Secciones agrupadas y etiquetadas (Principal / Gestión / Certificados
  / Catálogos / Config) con labels mono uppercase. Estado activo: fondo accent-ink
  + **línea de acento cyan** a la izquierda. Colapsable (icon-only con tooltips),
  persiste el colapso en localStorage. Radius 0.
- **`shell/Topbar.tsx`** — buscador global de pacientes (atajo `/` para enfocar),
  campana de alertas, identidad del usuario con **avatar cuadrado** cyan-ink
  (iniciales). Radius 0.
- **`shell/AlertBell.tsx`** — campana con badge del total PENDIENTE coloreado por
  severidad máxima (RN-11, `rounded-full` = pill funcional); refetch cada 60s;
  click abre un `Sheet` con las últimas alertas y acciones inline (Vista /
  Resolver / Descartar). Pulso único al subir la severidad.

### 5.4 Login — referencia de marca

`src/app/login/page.tsx` es la **referencia interna de la identidad GV-G**: split
50/50 (panel de marca ink-deep + panel de formulario blanco), logo GV-G una sola
vez (panel izquierdo), copy del **producto** (sistema de gestión de discapacidad),
crédito "Desarrollado por GV-G Consulting" al pie. Estilos scoped a `.gvg` con sus
propios tokens HSL (paridad con `globals.css`), motion de entrada escalonado.

### 5.5 Helpers

- `src/lib/severity.ts` — mapeo prioridad→semáforo (RN-11). **Fuente única.**
- `src/lib/timeAgo.ts` — "hace cuánto" en español, compacto.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).

---

## 6. Iconos

- **Shell y pantallas nuevas → Lucide** (`lucide-react`). Trazo consistente,
  tamaño 18px en navegación / 16–20px en acciones.
- **Páginas legacy → Heroicons** (`@heroicons/react`), hasta que se reconstruyan
  en la Ola 2. **No mezclar dos familias en una misma pantalla nueva.**
- **Nunca emojis como iconos.**

---

## 7. Legacy y migración

### Cómo NO se rompió nada (clave del re-tema)

Las páginas viejas usan DOS sistemas de color, ambos re-apuntados a la marca **sin
tocar su JSX**:

1. Escala `--primary-N` / `--neutral-N` (CSS vars) → re-apuntadas al cyan/tinta de
   marca en `globals.css`.
2. Utilidades `blue-*` **hardcodeadas** de Tailwind (`bg-blue-600`,
   `text-blue-600`, `ring-blue-500`, …) → **re-mapeadas a la escala de marca** en
   un bloque `@theme` (no-inline). Idem `neutral-*` (frío default → tinta fría de
   marca). Los radios built-in se anulan a 0, así todo `rounded-*` heredado se
   aplana automáticamente.

Clases legacy retintadas que se mantienen por compat: `.premium-card`,
`.btn-primary`, `.btn-secondary`, `.input-premium`, `.text-muted`, `.text-light`
(todas radius 0, retintadas a la marca). No crear nuevas; usar los componentes de
`ui/`.

### Regla de migración al reconstruir una pantalla (Ola 2)

1. Reemplazar `bg-blue-*` / `focus:ring-primary-500` ad-hoc por componentes `ui/`
   (`Button`, `Input`) o utilidades de token (`bg-primary-600`, `bg-surface`).
2. Migrar sus iconos Heroicons → Lucide.
3. Reemplazar la tabla ad-hoc por `<DataTable>`.
4. Aplicar `.tabular-nums` a toda columna numérica.
5. Título de página en Fraunces (`.font-display` o h1) + eyebrow mono.
6. Semáforo solo vía `severity.ts`.

---

## 8. Checklist de "hecho" para una pantalla

- [ ] Ningún color/espaciado/radio fuera de tokens. **Radius 0** (salvo pill
      funcional explícita: dot, badge de conteo, spinner, avatar circular).
- [ ] Cyan solo en fills/líneas/hover; **texto y links en `accent-ink`** (AA).
- [ ] Título de página en **Fraunces** (`.font-display`/h1) + eyebrow mono; body
      en Inter; números/metadata en JetBrains Mono.
- [ ] Semáforo (rojo/ámbar/verde) solo para severidad, vía `severity.ts`.
- [ ] `tabular-nums` en DNI/carnets/importes/contadores/fechas.
- [ ] Foco visible (anillo cyan-ink) en todo interactivo; contraste AA;
      `Enter` no submitea forms.
- [ ] Iconos Lucide (pantalla nueva); una sola familia.
- [ ] Estados vacío y skeleton diseñados (usar `DataTable`); coins de ícono
      cuadrados con borde.
- [ ] Transiciones 250–450ms con easing de marca; `prefers-reduced-motion`
      respetado.
- [ ] Sin `console.log`.
