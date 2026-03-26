"use client";

import { useEffect, useMemo, useState } from 'react';
import { alertasService } from '@/services/alertasService';
import {
  Alerta,
  CodigoAlerta,
  DashboardAlertas,
  EstadoAlerta,
  PrioridadAlerta
} from '@/types';
import {
  BellIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

const estadoOptions: { value: EstadoAlerta | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'VISTA', label: 'Vista' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'DESCARTADA', label: 'Descartada' }
];

const prioridadOptions: { value: PrioridadAlerta | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'CRITICA', label: 'Crítica' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'INFO', label: 'Info' }
];

const prioridadColorMap: Record<PrioridadAlerta, string> = {
  CRITICA: 'bg-red-100 text-red-700 border-red-200',
  ALTA: 'bg-amber-100 text-amber-700 border-amber-200',
  MEDIA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  BAJA: 'bg-sky-100 text-sky-700 border-sky-200',
  INFO: 'bg-blue-100 text-blue-700 border-blue-200'
};

const estadoColorMap: Record<EstadoAlerta, string> = {
  PENDIENTE: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  VISTA: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  RESUELTA: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DESCARTADA: 'bg-gray-100 text-gray-700 border-gray-200'
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function getSolucionesForAlerta(alerta: Alerta): string[] {
  const soluciones: string[] = [];
  const desc = (alerta.codigoAlerta?.descripcion || '').toLowerCase();
  const titulo = alerta.titulo.toLowerCase();
  const mensaje = alerta.mensaje.toLowerCase();
  const plantilla = alerta.codigoAlerta?.mensajePlantilla;
  if (plantilla) soluciones.push(plantilla);

  if (desc.includes('vencimiento') || desc.includes('vencido') || titulo.includes('vencimiento') || titulo.includes('vencido')) {
    soluciones.push('Solicitar al afiliado la documentación para renovar el certificado.');
    soluciones.push('Contactar al médico certificante para gestionar la renovación.');
  }
  if (desc.includes('certificado') || titulo.includes('certificado')) {
    soluciones.push('Verificar el estado del certificado en el historial del afiliado.');
  }
  if (desc.includes('afiliado') || desc.includes('contacto') || titulo.includes('afiliado')) {
    soluciones.push('Actualizar los datos de contacto del afiliado.');
    soluciones.push('Verificar que el afiliado esté al corriente con la documentación.');
  }
  if (desc.includes('prestacion') || desc.includes('servicio') || titulo.includes('prestacion')) {
    soluciones.push('Revisar las orientaciones prestacionales asignadas al afiliado.');
    soluciones.push('Verificar que los servicios correspondientes estén activos.');
  }
  if (alerta.prioridad === 'CRITICA' || alerta.prioridad === 'ALTA') {
    soluciones.push('Escalar la situación al supervisor o responsable de la administradora.');
    soluciones.push('Registrar la intervención una vez resuelta para el historial.');
  }
  if (desc.includes('edad') || mensaje.includes('edad') || titulo.includes('edad')) {
    soluciones.push('Verificar si el afiliado sigue dentro del rango etario habilitado.');
    soluciones.push('Revisar las orientaciones prestacionales que aplican según la nueva edad.');
  }
  if (soluciones.length <= 1) {
    soluciones.push('Revisar la información del afiliado y confirmar que esté actualizada.');
    soluciones.push('Contactar al afiliado para informar la situación y coordinar una solución.');
  }
  // deduplicate and limit
  return [...new Set(soluciones)].slice(0, 5);
}

export default function AlertsPage() {
  const [allAlertas, setAllAlertas] = useState<Alerta[]>([]);
  const [codigos, setCodigos] = useState<CodigoAlerta[]>([]);
  const [dashboard, setDashboard] = useState<DashboardAlertas | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoAlerta | 'ALL'>('ALL');
  const [prioridad, setPrioridad] = useState<PrioridadAlerta | 'ALL'>('ALL');
  const [codigoNumerico, setCodigoNumerico] = useState<'ALL' | string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, alertasData, codigosData] = await Promise.all([
        alertasService.getDashboard(),
        alertasService.getAlertas(),
        alertasService.getCodigos()
      ]);
      setDashboard(dashboardData);
      setAllAlertas(alertasData);
      setCodigos(codigosData);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAlertas = useMemo(() => {
    return allAlertas.filter((alerta) => {
      if (estado !== 'ALL' && alerta.estado !== estado) return false;
      if (prioridad !== 'ALL' && alerta.prioridad !== prioridad) return false;
      if (codigoNumerico !== 'ALL' && String(alerta.codigoAlerta?.codigo) !== codigoNumerico) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${alerta.afiliado?.nombre ?? ''} ${alerta.afiliado?.apellido ?? ''}`.toLowerCase();
        const matches =
          alerta.titulo.toLowerCase().includes(term) ||
          alerta.mensaje.toLowerCase().includes(term) ||
          fullName.includes(term) ||
          (alerta.afiliado?.dni ?? '').toLowerCase().includes(term) ||
          (alerta.codigoAlerta?.descripcion ?? '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [allAlertas, searchTerm, estado, prioridad, codigoNumerico]);

  const handleVista = async (id: string) => {
    try {
      setLoadingAction(true);
      await alertasService.marcarVista(id);
      await loadData();
    } catch (error) {
      console.error('Error al marcar vista:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResolver = async (id: string) => {
    try {
      setLoadingAction(true);
      await alertasService.resolver(id);
      await loadData();
    } catch (error) {
      console.error('Error al resolver:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDescartar = async (id: string) => {
    try {
      setLoadingAction(true);
      await alertasService.descartar(id);
      await loadData();
    } catch (error) {
      console.error('Error al descartar:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const codigoOptions = [
    { value: 'ALL', label: 'Todos' },
    ...codigos.map((c) => ({ value: String(c.codigo), label: `${c.codigo} - ${c.descripcion}` }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Alertas</h1>
          <p className="text-neutral-600 mt-2">
            Gestión de alertas generadas por reglas del sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <ClockIcon className="h-5 w-5" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="premium-card p-4">
          <p className="text-sm text-neutral-500">Total</p>
          <p className="text-2xl font-semibold text-neutral-900">{dashboard?.total ?? '-'}</p>
        </div>
        <div className="premium-card p-4">
          <p className="text-sm text-neutral-500">Pendientes</p>
          <p className="text-2xl font-semibold text-neutral-900">{dashboard?.pendientes ?? '-'}</p>
        </div>
        <div className="premium-card p-4">
          <p className="text-sm text-neutral-500">Críticas</p>
          <p className="text-2xl font-semibold text-neutral-900">{dashboard?.porPrioridad?.critica ?? '-'}</p>
        </div>
        <div className="premium-card p-4">
          <p className="text-sm text-neutral-500">Resueltas</p>
          <p className="text-2xl font-semibold text-neutral-900">{dashboard?.resueltas ?? '-'}</p>
        </div>
      </div>

      <div className="premium-card p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">Buscar</label>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="input-premium mt-2 w-full"
              placeholder="Título, afiliado, DNI..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Estado</label>
            <div className="mt-2">
              <SearchableSelect
                options={estadoOptions}
                value={estado}
                onChange={(value) => setEstado(value as EstadoAlerta | 'ALL')}
                placeholder="Seleccionar estado..."
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Prioridad</label>
            <div className="mt-2">
              <SearchableSelect
                options={prioridadOptions}
                value={prioridad}
                onChange={(value) => setPrioridad(value as PrioridadAlerta | 'ALL')}
                placeholder="Seleccionar prioridad..."
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Código</label>
            <div className="mt-2">
              <SearchableSelect
                options={codigoOptions}
                value={codigoNumerico}
                onChange={setCodigoNumerico}
                placeholder="Seleccionar código..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Alerta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Afiliado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Cargando alertas...
                  </td>
                </tr>
              ) : filteredAlertas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No hay alertas con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredAlertas.map((alerta) => {
                  const isExpanded = expandedId === alerta.id;
                  const soluciones = getSolucionesForAlerta(alerta);
                  return (
                    <>
                      <tr
                        key={alerta.id}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-amber-50' : 'hover:bg-neutral-50'}`}
                        onClick={() => setExpandedId(isExpanded ? null : alerta.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {alerta.prioridad === 'CRITICA' ? (
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                              ) : (
                                <BellIcon className="h-5 w-5 text-neutral-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{alerta.titulo}</p>
                              <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                {alerta.mensaje}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-700">
                          <div>
                            <p className="font-medium text-neutral-800">
                              {alerta.afiliado
                                ? `${alerta.afiliado.nombre} ${alerta.afiliado.apellido}`
                                : 'Sin afiliado'}
                            </p>
                            {alerta.afiliado?.dni && (
                              <p className="text-xs text-neutral-500">DNI {alerta.afiliado.dni}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                              prioridadColorMap[alerta.prioridad]
                            }`}
                          >
                            {alerta.prioridad}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                              estadoColorMap[alerta.estado]
                            }`}
                          >
                            {alerta.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-700">
                          {alerta.codigoAlerta?.codigo} - {alerta.codigoAlerta?.descripcion}
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-700">
                          {formatDate(alerta.fechaObjetivo ?? alerta.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end items-center gap-2">
                            {alerta.estado === 'PENDIENTE' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVista(alerta.id); }}
                                className="btn-secondary flex items-center gap-1"
                                disabled={loadingAction}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Vista
                              </button>
                            )}
                            {alerta.estado !== 'RESUELTA' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResolver(alerta.id); }}
                                className="btn-primary flex items-center gap-1"
                                disabled={loadingAction}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Resolver
                              </button>
                            )}
                            {alerta.estado !== 'DESCARTADA' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDescartar(alerta.id); }}
                                className="btn-danger flex items-center gap-1"
                                disabled={loadingAction}
                              >
                                <XCircleIcon className="h-4 w-4" />
                                Descartar
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : alerta.id); }}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                              title="Ver posibles soluciones"
                            >
                              {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${alerta.id}-soluciones`} className="bg-amber-50 border-t border-amber-100">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <LightBulbIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-amber-800 mb-2">Posibles soluciones</p>
                                <ul className="space-y-1.5">
                                  {soluciones.map((sol, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                                      <span className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center font-bold">
                                        {idx + 1}
                                      </span>
                                      {sol}
                                    </li>
                                  ))}
                                </ul>
                                {alerta.codigoAlerta?.validezHoras && (
                                  <p className="mt-2 text-xs text-amber-600">
                                    Esta alerta tiene validez de {alerta.codigoAlerta.validezHoras}hs desde su generación.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
