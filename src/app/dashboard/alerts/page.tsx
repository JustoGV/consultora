"use client";

import { useEffect, useMemo, useState } from 'react';
import { alertasService } from '@/services/alertasService';
import {
  Alerta,
  AlertasQueryParams,
  CodigoAlerta,
  DashboardAlertas,
  EstadoAlerta,
  PrioridadAlerta
} from '@/types';
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
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

const codigoDefaultOptions = [{ value: 'ALL', label: 'Todos' }];

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

export default function AlertsPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [codigos, setCodigos] = useState<CodigoAlerta[]>([]);
  const [dashboard, setDashboard] = useState<DashboardAlertas | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState<EstadoAlerta | 'ALL'>('ALL');
  const [prioridad, setPrioridad] = useState<PrioridadAlerta | 'ALL'>('ALL');
  const [codigoNumerico, setCodigoNumerico] = useState<'ALL' | string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, alertasData, codigosData] = await Promise.all([
        alertasService.getDashboard(),
        alertasService.getAlertas(),
        alertasService.getCodigos()
      ]);
      setDashboard(dashboardData);
      setAlertas(alertasData);
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

  useEffect(() => {
    const params: AlertasQueryParams = {};
    if (estado !== 'ALL') params.estado = estado;
    if (prioridad !== 'ALL') params.prioridad = prioridad;
    if (codigoNumerico !== 'ALL' && codigoNumerico !== '') {
      params.codigoNumerico = Number(codigoNumerico);
    }

    const fetchFiltered = async () => {
      try {
        setLoading(true);
        const data = await alertasService.getAlertas(params);
        setAlertas(data);
      } catch (error) {
        console.error('Error al filtrar alertas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [estado, prioridad, codigoNumerico]);

  const filteredAlertas = useMemo(() => {
    if (!searchTerm) return alertas;
    const term = searchTerm.toLowerCase();
    return alertas.filter((alerta) =>
      alerta.titulo.toLowerCase().includes(term) ||
      alerta.mensaje.toLowerCase().includes(term) ||
      alerta.afiliado?.nombre?.toLowerCase().includes(term) ||
      alerta.afiliado?.apellido?.toLowerCase().includes(term) ||
      alerta.afiliado?.dni?.toLowerCase().includes(term)
    );
  }, [alertas, searchTerm]);

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
                options={codigoDefaultOptions.concat(
                  codigos.map((codigo) => ({
                    value: String(codigo.codigo),
                    label: `${codigo.codigo} - ${codigo.descripcion}`
                  }))
                )}
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
                filteredAlertas.map((alerta) => (
                  <tr key={alerta.id}>
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
                      <div className="flex justify-end gap-2">
                        {alerta.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => handleVista(alerta.id)}
                            className="btn-secondary flex items-center gap-1"
                            disabled={loadingAction}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Vista
                          </button>
                        )}
                        {alerta.estado !== 'RESUELTA' && (
                          <button
                            onClick={() => handleResolver(alerta.id)}
                            className="btn-primary flex items-center gap-1"
                            disabled={loadingAction}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Resolver
                          </button>
                        )}
                        {alerta.estado !== 'DESCARTADA' && (
                          <button
                            onClick={() => handleDescartar(alerta.id)}
                            className="btn-danger flex items-center gap-1"
                            disabled={loadingAction}
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Descartar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
