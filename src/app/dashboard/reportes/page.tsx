'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, Printer, FileBarChart2 } from 'lucide-react';

import { afiliacionesService } from '@/services/afiliacionesService';
import { obrasSocialesService } from '@/services/obrasSocialesService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { alertasService } from '@/services/alertasService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { exportToCsv, type CsvColumn } from '@/lib/csv';
import { TONE_VARS } from '@/lib/severity';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/SearchableSelect';
import type {
  Afiliacion,
  Alerta,
  CertificadoDiscapacidad,
  ObraSocial,
} from '@/types';

/**
 * /dashboard/reportes (UX-6) — "Resultante por obra social", el reporte
 * gerencial pedido en la reunión (bloque 46). Reemplaza conceptualmente
 * "Métricas" (que queda huérfana por ahora, ver Sidebar.tsx).
 *
 * DATOS Y SUPUESTOS (documentados a pedido de la spec):
 * - El dataset se asume chico en esta etapa del producto (sin clientes activos
 *   en prod aún — ver CLAUDE.md), por eso la resultante se arma agregando
 *   client-side sobre tres GETs completos (afiliaciones, certificados, alertas)
 *   en vez de pedir un endpoint de agregación nuevo al backend. Si el volumen
 *   crece, esto debería moverse a un endpoint `/reportes/resultante` server-side.
 * - Afiliaciones: GET /afiliaciones SÍ soporta filtro server-side por
 *   `obraSocialId` (afiliaciones.service.ts:120) y expande `persona` + `obraSocial`
 *   (leftJoinAndSelect). Cuando hay un filtro de OS elegido se pide ya filtrado;
 *   con "Todas" se trae todo y se agrupa client-side por `obraSocial.id`.
 * - Certificados: certificadosDiscapacidadService NO tiene filtro por obra
 *   social (solo por personaId). Se trae la colección completa y se cruza
 *   client-side: personaId del certificado -> personaId de cada afiliación ->
 *   obraSocialId. Una persona con afiliaciones en varias OS puede aportar el
 *   mismo certificado a más de una fila (es una persona, no una afiliación) —
 *   comportamiento esperado dado que el certificado es de la PERSONA, no de la
 *   afiliación.
 * - Alertas: alertasService NO expone filtro por obra social en /alertas (el
 *   backend resuelve multi-tenancy por usuario logueado, no como filtro
 *   elegible — mismo desvío ya documentado en /dashboard/alerts/page.tsx). Se
 *   trae la colección completa (sin paginar) y se cruza igual que certificados
 *   vía `alerta.persona`.
 * - Gráfico de certificados por vencimiento: SÍ se pudo construir. El tipo
 *   `CertificadoDiscapacidad.fechaVencimiento` es accesible en el DTO y viene
 *   en la respuesta de `getAll()`; se clasifica vigente/vencido comparando
 *   contra la fecha actual (sin fecha = se cuenta como vigente, criterio
 *   conservador ya que no hay vencimiento conocido).
 */

interface FilaResultante {
  obraSocialId: string;
  obraSocialNombre: string;
  afiliacionesTotales: number;
  titulares: number;
  adherentes: number;
  certificados: number;
  alertasPendientes: number;
}

const CHART_TICK = { fontSize: 11, fill: 'var(--fg-muted)' };
const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-md)',
  fontSize: '13px',
  color: 'var(--fg)',
};

const TITULAR_COLOR = 'var(--primary-600)';
const ADHERENTE_COLOR = 'var(--primary-300)';
const VIGENTE_COLOR = 'var(--primary-500)';
const VENCIDO_COLOR = 'var(--sev-critica)';

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [afiliaciones, setAfiliaciones] = useState<Afiliacion[]>([]);
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const [obraSocialId, setObraSocialId] = useState<string>('');

  const loadData = useCallback(async (filtroObraSocialId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [obrasSocialesData, afiliacionesData, certificadosData, alertasData] =
        await Promise.all([
          obrasSocialesService.getAll(),
          afiliacionesService.getAll(
            filtroObraSocialId ? { obraSocialId: filtroObraSocialId } : undefined
          ),
          certificadosDiscapacidadService.getAll(),
          alertasService.getAlertas(),
        ]);
      setObrasSociales(obrasSocialesData);
      setAfiliaciones(afiliacionesData);
      setCertificados(certificadosData);
      setAlertas(alertasData);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar los datos del reporte'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(obraSocialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraSocialId]);

  // Mapa personaId -> Set<obraSocialId> (una persona puede tener afiliaciones en
  // varias obras sociales). Se usa para atribuir certificados/alertas a cada OS.
  const obrasSocialesPorPersona = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const af of afiliaciones) {
      if (!af.personaId || !af.obraSocialId) continue;
      const set = map.get(af.personaId) ?? new Set<string>();
      set.add(af.obraSocialId);
      map.set(af.personaId, set);
    }
    return map;
  }, [afiliaciones]);

  const filas: FilaResultante[] = useMemo(() => {
    const porObraSocial = new Map<string, FilaResultante>();

    const getOrInit = (id: string, nombre: string): FilaResultante => {
      let fila = porObraSocial.get(id);
      if (!fila) {
        fila = {
          obraSocialId: id,
          obraSocialNombre: nombre,
          afiliacionesTotales: 0,
          titulares: 0,
          adherentes: 0,
          certificados: 0,
          alertasPendientes: 0,
        };
        porObraSocial.set(id, fila);
      }
      return fila;
    };

    // Semilla: todas las OS visibles (aunque tengan 0 afiliaciones), respetando el filtro.
    const obrasSocialesVisibles = obraSocialId
      ? obrasSociales.filter((os) => os.id === obraSocialId)
      : obrasSociales;
    for (const os of obrasSocialesVisibles) {
      getOrInit(os.id, os.sigla || os.nombre);
    }

    for (const af of afiliaciones) {
      if (!af.obraSocialId) continue;
      const nombre = af.obraSocial?.sigla || af.obraSocial?.nombre || 'Sin obra social';
      const fila = getOrInit(af.obraSocialId, nombre);
      fila.afiliacionesTotales += 1;
      if (af.rol === 'TITULAR') fila.titulares += 1;
      else if (af.rol === 'ADHERENTE') fila.adherentes += 1;
    }

    for (const cert of certificados) {
      const obrasDeLaPersona = obrasSocialesPorPersona.get(cert.personaId);
      if (!obrasDeLaPersona) continue;
      for (const osId of obrasDeLaPersona) {
        if (obraSocialId && osId !== obraSocialId) continue;
        const fila = porObraSocial.get(osId);
        if (fila) fila.certificados += 1;
      }
    }

    for (const alerta of alertas) {
      if (alerta.estado !== 'PENDIENTE') continue;
      const obrasDeLaPersona = obrasSocialesPorPersona.get(alerta.personaId);
      if (!obrasDeLaPersona) continue;
      for (const osId of obrasDeLaPersona) {
        if (obraSocialId && osId !== obraSocialId) continue;
        const fila = porObraSocial.get(osId);
        if (fila) fila.alertasPendientes += 1;
      }
    }

    return Array.from(porObraSocial.values()).sort(
      (a, b) => b.afiliacionesTotales - a.afiliacionesTotales
    );
  }, [obrasSociales, afiliaciones, certificados, alertas, obraSocialId, obrasSocialesPorPersona]);

  const totales = useMemo(
    () =>
      filas.reduce(
        (acc, f) => ({
          afiliacionesTotales: acc.afiliacionesTotales + f.afiliacionesTotales,
          titulares: acc.titulares + f.titulares,
          adherentes: acc.adherentes + f.adherentes,
          certificados: acc.certificados + f.certificados,
          alertasPendientes: acc.alertasPendientes + f.alertasPendientes,
        }),
        { afiliacionesTotales: 0, titulares: 0, adherentes: 0, certificados: 0, alertasPendientes: 0 }
      ),
    [filas]
  );

  const hayDatos = totales.afiliacionesTotales > 0 || certificados.length > 0 || alertas.length > 0;

  // Gráfico 1: afiliaciones por OS, apiladas titular/adherente.
  const chartAfiliaciones = useMemo(
    () =>
      filas
        .filter((f) => f.afiliacionesTotales > 0)
        .map((f) => ({ nombre: f.obraSocialNombre, titulares: f.titulares, adherentes: f.adherentes })),
    [filas]
  );

  // Gráfico 2: donut de alertas por semáforo (contando SOLO PENDIENTE, coherente
  // con la columna "Alertas pendientes" de la tabla). Colores EXACTOS de severity.ts.
  const chartAlertas = useMemo(() => {
    const alertasFiltradas = obraSocialId
      ? alertas.filter((a) => {
          const set = obrasSocialesPorPersona.get(a.personaId);
          return set?.has(obraSocialId) ?? false;
        })
      : alertas;

    let critica = 0;
    let media = 0;
    let baja = 0;
    for (const a of alertasFiltradas) {
      if (a.estado !== 'PENDIENTE') continue;
      if (a.prioridad === 'CRITICA' || a.prioridad === 'ALTA') critica += 1;
      else if (a.prioridad === 'MEDIA') media += 1;
      else baja += 1;
    }

    return [
      { name: 'Crítica / Alta', value: critica, color: TONE_VARS.critica.solid },
      { name: 'Media', value: media, color: TONE_VARS.media.solid },
      { name: 'Baja / Info', value: baja, color: TONE_VARS.baja.solid },
    ].filter((d) => d.value > 0);
  }, [alertas, obraSocialId, obrasSocialesPorPersona]);

  // Gráfico 3: certificados vigentes/vencidos. fechaVencimiento SÍ está expuesta
  // en CertificadoDiscapacidad y viene en getAll() — no se omite (ver nota arriba).
  const chartCertificados = useMemo(() => {
    const certificadosFiltrados = obraSocialId
      ? certificados.filter((c) => obrasSocialesPorPersona.get(c.personaId)?.has(obraSocialId))
      : certificados;

    const hoy = new Date();
    let vigentes = 0;
    let vencidos = 0;
    for (const c of certificadosFiltrados) {
      if (!c.fechaVencimiento) {
        vigentes += 1;
        continue;
      }
      if (new Date(c.fechaVencimiento) < hoy) vencidos += 1;
      else vigentes += 1;
    }
    return [
      { name: 'Vigentes', cantidad: vigentes },
      { name: 'Vencidos', cantidad: vencidos },
    ];
  }, [certificados, obraSocialId, obrasSocialesPorPersona]);

  const obraSocialSeleccionada = obrasSociales.find((os) => os.id === obraSocialId);
  const filtroLabel = obraSocialSeleccionada
    ? obraSocialSeleccionada.sigla || obraSocialSeleccionada.nombre
    : 'Todas las obras sociales';

  const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const csvColumns: CsvColumn<FilaResultante>[] = [
    { header: 'Obra Social', value: (f) => f.obraSocialNombre },
    { header: 'Afiliaciones totales', value: (f) => f.afiliacionesTotales },
    { header: 'Titulares', value: (f) => f.titulares },
    { header: 'Adherentes', value: (f) => f.adherentes },
    { header: 'Certificados CUD', value: (f) => f.certificados },
    { header: 'Alertas pendientes', value: (f) => f.alertasPendientes },
  ];

  const handleExportCsv = () => {
    exportToCsv(csvColumns, filas, `resultante-por-obra-social_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const obraSocialOptions = [
    { value: '', label: 'Todas' },
    ...obrasSociales.map((os) => ({ value: os.id, label: os.sigla || os.nombre })),
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado solo de pantalla */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--fg)]">Reportes</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Resultante por obra social — vista presentable para dirección y cliente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <SearchableSelect
              options={obraSocialOptions}
              value={obraSocialId}
              onChange={setObraSocialId}
              placeholder="Obra social"
            />
          </div>
          <Button variant="outline" onClick={handlePrint} disabled={loading || !hayDatos}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {error && (
        <div className="no-print rounded-md border border-[var(--sev-critica-bg)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
          {error}
        </div>
      )}

      {/* Área imprimible (también es lo que se ve en pantalla) */}
      <div className="print-area space-y-6">
        {/* Encabezado exclusivo de impresión: nombre del tenant + fecha + filtro */}
        <div className="print-header mb-6 hidden border-b border-black/20 pb-3">
          <h1 className="text-xl font-semibold">GV-G Consulting — Reporte de resultante</h1>
          <p className="text-sm">
            Generado el {fechaGeneracion} · Filtro: {filtroLabel}
          </p>
        </div>

        {loading ? (
          <ReportesSkeleton />
        ) : !hayDatos ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--fg-subtle)]">
              <FileBarChart2 className="size-6" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-[var(--fg)]">
              Todavía no hay datos para reportar
            </p>
            <p className="mx-auto max-w-xs text-sm text-[var(--fg-muted)]">
              Cargá personas, afiliaciones y certificados para ver la resultante acá.
            </p>
          </div>
        ) : (
          <>
            {/* Reporte estrella: tabla espaciada (no DataTable densa) */}
            <section className="print-section rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
              <div className="no-print flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--fg)]">
                    Resultante por obra social
                  </h2>
                  <p className="text-sm text-[var(--fg-muted)]">{filtroLabel}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <Download className="size-4" />
                  Exportar CSV
                </Button>
              </div>
              <div className="hidden px-1 pt-4 print:block">
                <h2 className="px-4 text-base font-semibold">Resultante por obra social</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-sunken)] text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      <th className="px-5 py-3 text-left">Obra social</th>
                      <th className="px-5 py-3 text-right">Afiliaciones totales</th>
                      <th className="px-5 py-3 text-right">Titulares</th>
                      <th className="px-5 py-3 text-right">Adherentes</th>
                      <th className="px-5 py-3 text-right">Certificados CUD</th>
                      <th className="px-5 py-3 text-right">Alertas pendientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, idx) => (
                      <tr
                        key={f.obraSocialId}
                        className={cn(
                          'border-b border-[var(--border)] last:border-0',
                          idx % 2 === 1 && 'bg-[var(--surface-sunken)]/40'
                        )}
                      >
                        <td className="px-5 py-3.5 font-medium text-[var(--fg)]">
                          {f.obraSocialNombre}
                        </td>
                        <td className="tabular-nums px-5 py-3.5 text-right">
                          {f.afiliacionesTotales}
                        </td>
                        <td className="tabular-nums px-5 py-3.5 text-right">{f.titulares}</td>
                        <td className="tabular-nums px-5 py-3.5 text-right">{f.adherentes}</td>
                        <td className="tabular-nums px-5 py-3.5 text-right">{f.certificados}</td>
                        <td className="tabular-nums px-5 py-3.5 text-right">
                          {f.alertasPendientes > 0 ? (
                            <span
                              className="inline-flex min-w-6 items-center justify-center rounded-sm px-1.5 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: TONE_VARS.critica.bg,
                                color: TONE_VARS.critica.fg,
                              }}
                            >
                              {f.alertasPendientes}
                            </span>
                          ) : (
                            <span className="text-[var(--fg-subtle)]">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--border-strong)] bg-[var(--surface-sunken)] font-semibold text-[var(--fg)]">
                      <td className="px-5 py-3.5">Total</td>
                      <td className="tabular-nums px-5 py-3.5 text-right">
                        {totales.afiliacionesTotales}
                      </td>
                      <td className="tabular-nums px-5 py-3.5 text-right">{totales.titulares}</td>
                      <td className="tabular-nums px-5 py-3.5 text-right">{totales.adherentes}</td>
                      <td className="tabular-nums px-5 py-3.5 text-right">
                        {totales.certificados}
                      </td>
                      <td className="tabular-nums px-5 py-3.5 text-right">
                        {totales.alertasPendientes}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Gráficos re-estilizados con tokens */}
            <div className="print-section grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-base font-semibold text-[var(--fg)]">
                  Afiliaciones por obra social
                </h3>
                <p className="text-xs text-[var(--fg-muted)]">Titular / Adherente (apiladas)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartAfiliaciones}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="nombre" tick={CHART_TICK} />
                    <YAxis tick={CHART_TICK} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="titulares" name="Titulares" stackId="a" fill={TITULAR_COLOR} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="adherentes" name="Adherentes" stackId="a" fill={ADHERENTE_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-base font-semibold text-[var(--fg)]">
                  Alertas por semáforo
                </h3>
                <p className="text-xs text-[var(--fg-muted)]">Pendientes, según RN-11</p>
                {chartAlertas.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-[var(--fg-subtle)]">
                    Sin alertas pendientes.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartAlertas}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartAlertas.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] lg:col-span-2">
                <h3 className="text-base font-semibold text-[var(--fg)]">
                  Certificados por estado
                </h3>
                <p className="text-xs text-[var(--fg-muted)]">Vigentes vs. vencidos (por fechaVencimiento)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartCertificados} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={CHART_TICK} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={CHART_TICK} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                      {chartCertificados.map((d) => (
                        <Cell key={d.name} fill={d.name === 'Vigentes' ? VIGENTE_COLOR : VENCIDO_COLOR} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReportesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <span className="skeleton mb-4 block h-5 w-64 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="skeleton mb-2 block h-9 w-full rounded" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="skeleton mb-4 block h-4 w-40 rounded" />
            <span className="skeleton block h-[240px] w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
