"use client";

import * as React from "react";
import { Search, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Definición de una columna del DataTable.
 *
 * @template T tipo de la fila.
 */
export interface DataTableColumn<T> {
  /** Identificador único de la columna (usado como key). */
  id: string;
  /** Encabezado visible. */
  header: React.ReactNode;
  /** Render de la celda para una fila dada. */
  cell: (row: T) => React.ReactNode;
  /** Alineación del contenido. Usar "right" para números/documentos. */
  align?: "left" | "right" | "center";
  /**
   * Números tabulares (DNI, carnets, importes, contadores). Aplica la clase
   * `tabular-nums` a la celda para alinear dígitos y evitar saltos de layout.
   */
  numeric?: boolean;
  /** Clases extra para la celda (ancho, truncado, etc.). */
  className?: string;
  /** Clases extra para el <th>. */
  headerClassName?: string;
}

export interface DataTableProps<T> {
  /** Columnas de la tabla. */
  columns: DataTableColumn<T>[];
  /** Filas a renderizar (la página actual — la paginación es externa). */
  data: T[];
  /** Clave estable por fila. Recomendado siempre. */
  getRowId?: (row: T, index: number) => string;
  /** Estado de carga → muestra filas skeleton. */
  loading?: boolean;
  /** Cantidad de filas skeleton mientras carga. */
  skeletonRows?: number;
  /** Click en fila (abre detalle, etc.). Si se pasa, la fila es cursor-pointer. */
  onRowClick?: (row: T) => void;

  /* --- Slot de búsqueda (arriba-izquierda, UX-7). Controlado por el padre. --- */
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Acciones/filtros a la derecha del buscador (chips de semáforo, botón "Nuevo", etc.). */
  toolbar?: React.ReactNode;

  /** Slot de paginación (pluggable — pasar <Pagination /> server o client-side). */
  pagination?: React.ReactNode;

  /* --- Estado vacío diseñado (UX-7). --- */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  /** CTA del estado vacío (ej. botón "Nueva persona"). */
  emptyAction?: React.ReactNode;

  /** Clase del contenedor externo. */
  className?: string;
  /** Alto máximo del área scrolleable de la tabla (header queda sticky). */
  maxHeight?: string;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/**
 * DataTable — tabla densa del design system (UX-7).
 *
 * Filas ~40px, header sticky, zebra sutil, tabular-nums en columnas numéricas,
 * slot de búsqueda con debounce (controlado por el padre), estados vacío y
 * skeleton, y paginación pluggable. Genérico y tipado; las pantallas de la
 * Ola 2 lo consumen.
 *
 * @example
 * ```tsx
 * type Persona = { id: string; apellido: string; dni: string };
 *
 * const columns: DataTableColumn<Persona>[] = [
 *   { id: "apellido", header: "Apellido", cell: (p) => p.apellido },
 *   { id: "dni", header: "DNI", cell: (p) => p.dni, numeric: true, align: "right" },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={pageItems}
 *   getRowId={(p) => p.id}
 *   loading={loading}
 *   searchable
 *   searchValue={q}
 *   onSearchChange={setQ}            // el padre aplica el debounce (300ms) + fetch
 *   searchPlaceholder="Buscar paciente…"
 *   onRowClick={(p) => router.push(`/dashboard/personas/${p.id}`)}
 *   pagination={<Pagination {...paginationProps} />}
 *   emptyTitle="Sin pacientes"
 *   emptyDescription="Cargá el primero para empezar."
 *   emptyAction={<Button>Nueva persona</Button>}
 * />
 * ```
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  skeletonRows = 8,
  onRowClick,
  searchable = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  toolbar,
  pagination,
  emptyTitle = "Sin resultados",
  emptyDescription = "No hay datos para mostrar con los filtros actuales.",
  emptyIcon,
  emptyAction,
  className,
  maxHeight,
}: DataTableProps<T>) {
  const showToolbar = searchable || toolbar;
  const isEmpty = !loading && data.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {/* Toolbar: búsqueda (izq) + acciones/filtros (der) */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2.5">
          {searchable ? (
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-subtle)]"
                aria-hidden
              />
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={cn(
                  "h-9 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] pl-8 pr-3 text-sm text-[var(--fg)]",
                  "placeholder:text-[var(--fg-subtle)] outline-none transition-[border-color,box-shadow] duration-150",
                  "focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--primary-600)_18%,transparent)]"
                )}
              />
            </div>
          ) : (
            <span />
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Área de tabla (scroll vertical con header sticky) */}
      <div
        className="overflow-y-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {isEmpty ? (
          <DataTableEmpty
            title={emptyTitle}
            description={emptyDescription}
            icon={emptyIcon}
            action={emptyAction}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={col.id}
                    className={cn(
                      alignClass[col.align ?? "left"],
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: skeletonRows }).map((_, r) => (
                    <TableRow key={`sk-${r}`} className="hover:bg-transparent">
                      {columns.map((col) => (
                        <TableCell key={col.id} className={col.className}>
                          <span
                            className="skeleton block h-3.5 w-full max-w-[8rem] rounded"
                            style={{ opacity: 1 - r * 0.06 }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data.map((row, i) => {
                    const key = getRowId ? getRowId(row, i) : String(i);
                    return (
                      <TableRow
                        key={key}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(onRowClick && "cursor-pointer")}
                      >
                        {columns.map((col) => (
                          <TableCell
                            key={col.id}
                            className={cn(
                              alignClass[col.align ?? "left"],
                              col.numeric && "tabular-nums",
                              col.className
                            )}
                          >
                            {col.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginación (pluggable) */}
      {pagination && !isEmpty && (
        <div className="border-t border-[var(--border)]">{pagination}</div>
      )}
    </div>
  );
}

/** Estado vacío diseñado (ilustración sobria + copy + CTA). */
function DataTableEmpty({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--fg-subtle)]">
        {icon ?? <Inbox className="size-6" aria-hidden />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--fg)]">{title}</p>
        <p className="mx-auto max-w-xs text-sm text-[var(--fg-muted)]">
          {description}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
