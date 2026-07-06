/**
 * csv.ts — export CSV client-side (UX-6, botón "Exportar CSV" por tabla).
 *
 * Genera el archivo en el navegador (Blob + <a download>), sin llamada al
 * backend. Antepone BOM UTF-8 (`﻿`) para que Excel en Windows reconozca
 * la codificación y no rompa acentos/ñ.
 */

/** Escapa un valor para una celda CSV (RFC 4180): comillas dobles + separador. */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

/** Arma el contenido CSV (con BOM) a partir de columnas + filas. */
export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const headerLine = columns.map((c) => escapeCsvValue(c.header)).join(';');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvValue(c.value(row))).join(';')
  );
  return '﻿' + [headerLine, ...lines].join('\r\n');
}

/** Dispara la descarga de un CSV ya armado (string) con el nombre de archivo dado. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Atajo: arma y descarga en un solo paso. */
export function exportToCsv<T>(
  columns: CsvColumn<T>[],
  rows: T[],
  filename: string
): void {
  downloadCsv(buildCsv(columns, rows), filename);
}
