'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  OrientacionPrestacional,
  CreateOrientacionPrestacionalDto,
  PrioridadOrientacion,
  Servicio,
  ServicioNoNomenclado
} from '@/types';
import { orientacionPrestacionalService } from '@/services/orientacionPrestacionalService';
import { serviciosService } from '@/services/serviciosService';
import { serviciosNoNomencladosService } from '@/services/serviciosNoNomencladosService';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractErrorMessage } from '@/lib/errorUtils';

const prioridadOptions = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' }
];

export default function OrientacionPrestacionalPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [orientaciones, setOrientaciones] = useState<OrientacionPrestacional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [serviciosNoNom, setServiciosNoNom] = useState<ServicioNoNomenclado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrientacion, setEditingOrientacion] = useState<OrientacionPrestacional | null>(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedServicioId, setSelectedServicioId] = useState('');
  const [selectedServicioNoNomId, setSelectedServicioNoNomId] = useState('');
  const [todasEdades, setTodasEdades] = useState(false);

  const [formData, setFormData] = useState<CreateOrientacionPrestacionalDto>({
    titulo: '',
    edadDesde: undefined,
    edadHasta: undefined,
    prioridad: 'MEDIA'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [orientacionesData, serviciosData, snnData] = await Promise.all([
        orientacionPrestacionalService.getAll(),
        serviciosService.getAll(),
        serviciosNoNomencladosService.getAll()
      ]);
      setOrientaciones(orientacionesData);
      setServicios(serviciosData);
      setServiciosNoNom(snnData);
      if (editingOrientacion) {
        const updated = orientacionesData.find((orientacion) => orientacion.id === editingOrientacion.id);
        if (updated) {
          setEditingOrientacion(updated);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar orientaciones');
    } finally {
      setLoading(false);
    }
  }, [editingOrientacion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (orientacion?: OrientacionPrestacional) => {
    setFormError('');
    setFieldErrors({});
    if (orientacion) {
      setEditingOrientacion(orientacion);
      const sinEdades = orientacion.edadDesde == null && orientacion.edadHasta == null;
      setTodasEdades(sinEdades);
      setFormData({
        titulo: orientacion.titulo,
        edadDesde: orientacion.edadDesde ?? undefined,
        edadHasta: orientacion.edadHasta ?? undefined,
        prioridad: orientacion.prioridad
      });
    } else {
      setEditingOrientacion(null);
      setTodasEdades(false);
      setFormData({
        titulo: '',
        edadDesde: undefined,
        edadHasta: undefined,
        prioridad: 'MEDIA'
      });
    }
  setSelectedServicioId('');
  setSelectedServicioNoNomId('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrientacion(null);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo) {
      setFieldErrors({ titulo: 'Requerido' });
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      if (editingOrientacion) {
        await orientacionPrestacionalService.update(editingOrientacion.id, formData);
        if (selectedServicioId) {
          await orientacionPrestacionalService.addServicio(editingOrientacion.id, { servicioId: selectedServicioId });
        }
      } else {
        const created = await orientacionPrestacionalService.create(formData);
        if (selectedServicioId) {
          await orientacionPrestacionalService.addServicio(created.id, { servicioId: selectedServicioId });
        }
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar orientación:', error);
      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta orientación?')) return;

    try {
      await orientacionPrestacionalService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar orientación');
    }
  };

  const handleAddServicio = async () => {
    if (!editingOrientacion || !selectedServicioId) return;

    try {
      await orientacionPrestacionalService.addServicio(editingOrientacion.id, { servicioId: selectedServicioId });
      await loadData();
      setSelectedServicioId('');
    } catch (error) {
      console.error('Error al agregar servicio:', error);
      alert('Error al agregar servicio');
    }
  };

  const handleAddServicioNoNom = async () => {
    if (!editingOrientacion || !selectedServicioNoNomId) return;

    try {
      await orientacionPrestacionalService.addServicioNoNomenclado(editingOrientacion.id, { servicioNoNomencladoId: selectedServicioNoNomId });
      await loadData();
      setSelectedServicioNoNomId('');
    } catch (error) {
      console.error('Error al agregar servicio no nomenclado:', error);
      alert('Error al agregar servicio no nomenclado');
    }
  };

  const handleRemoveServicio = async (servicioId: string) => {
    if (!editingOrientacion) return;

    try {
      await orientacionPrestacionalService.removeServicio(editingOrientacion.id, servicioId);
      await loadData();
    } catch (error) {
      console.error('Error al remover servicio:', error);
      alert('Error al remover servicio');
    }
  };

  const handleRemoveServicioNoNom = async (servicioId: string) => {
    if (!editingOrientacion) return;

    try {
      await orientacionPrestacionalService.removeServicioNoNomenclado(editingOrientacion.id, servicioId);
      await loadData();
    } catch (error) {
      console.error('Error al remover servicio no nomenclado:', error);
      alert('Error al remover servicio no nomenclado');
    }
  };


  const filteredOrientaciones = orientaciones.filter((orientacion) => {
    const search = searchTerm.toLowerCase();
    return orientacion.titulo.toLowerCase().includes(search);
  });

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedOrientaciones,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredOrientaciones, itemsPerPage: 10 });

  const servicioNomOptions = servicios.map((servicio) => ({
    value: servicio.id,
    label: `${servicio.titulo} (${servicio.nomenclador?.codigoPrestacion || 'N/A'})`
  }));

  const servicioNoNomOptions = serviciosNoNom.map((snn) => ({
    value: snn.id,
    label: `${snn.titulo} — ${snn.convenio === 'CON_CONVENIO' ? 'Con convenio' : 'Sin convenio'}${snn.prestador?.efector?.nombre ? ` (${snn.prestador.efector.nombre})` : ''}`
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Orientación Prestacional
          </h1>
          <p className="text-neutral-600 mt-2">Gestión de recomendaciones y asociaciones</p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Nueva Orientación
          </button>
        )}
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Rango de Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Prioridad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Servicios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Serv. No Nom.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Certificados</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedOrientaciones.map((orientacion) => (
                  <tr key={orientacion.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-neutral-900">{orientacion.titulo}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {orientacion.edadDesde == null && orientacion.edadHasta == null
                        ? <span className="text-neutral-400 italic">Todas las edades</span>
                        : orientacion.edadDesde != null && orientacion.edadHasta == null
                        ? `≥ ${orientacion.edadDesde} años`
                        : orientacion.edadDesde == null && orientacion.edadHasta != null
                        ? `Hasta ${orientacion.edadHasta} años`
                        : `${orientacion.edadDesde} – ${orientacion.edadHasta} años`
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{orientacion.prioridad}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {orientacion.servicios?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {orientacion.serviciosNoNomenclados?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {orientacion.certificados?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(isSuperAdmin || isAdmin) ? (
                        <>
                          <button
                            onClick={() => handleOpenModal(orientacion)}
                            className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(orientacion.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-400">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedOrientaciones.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No se encontraron orientaciones</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredOrientaciones.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingOrientacion ? 'Editar Orientación' : 'Nueva Orientación'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="todasEdades"
                    checked={todasEdades}
                    onChange={(e) => {
                      setTodasEdades(e.target.checked);
                      if (e.target.checked) {
                        setFormData({ ...formData, edadDesde: undefined, edadHasta: undefined });
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="todasEdades" className="text-sm font-medium text-neutral-700">
                    Aplica para todas las edades
                  </label>
                </div>
                {!todasEdades && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Edad Desde <span className="text-neutral-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.edadDesde ?? ''}
                        onChange={(e) => setFormData({ ...formData, edadDesde: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        min={0}
                        max={120}
                        placeholder="Sin límite inferior"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Edad Límite / Hasta <span className="text-neutral-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.edadHasta ?? ''}
                        onChange={(e) => setFormData({ ...formData, edadHasta: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        min={0}
                        max={120}
                        placeholder="Sin límite superior"
                      />
                      <p className="text-xs text-neutral-400 mt-1">
                        Definir una edad límite permite generar alertas cuando el afiliado supera ese umbral.
                      </p>
                    </div>
                  </div>
                )}
                {todasEdades && (
                  <p className="text-sm text-neutral-500 italic">No se aplicarán restricciones de edad.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Prioridad *</label>
                <SearchableSelect
                  options={prioridadOptions}
                  value={formData.prioridad}
                  onChange={(value) => setFormData({ ...formData, prioridad: value as PrioridadOrientacion })}
                  placeholder="Seleccionar prioridad..."
                  required
                />
              </div>

              <div className="space-y-6">
                {/* -- Servicios Nomenclados -- */}
                <div>
                  <h4 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Nomenclados</span>
                    Servicios Nomenclados
                  </h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <SearchableSelect
                        options={servicioNomOptions}
                        value={selectedServicioId}
                        onChange={setSelectedServicioId}
                        placeholder="Seleccionar servicio nomenclado..."
                      />
                    </div>
                    {editingOrientacion && (
                      <button
                        type="button"
                        onClick={handleAddServicio}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                  {!editingOrientacion && (
                    <p className="text-xs text-neutral-500 mt-2">Se asociará al guardar la orientación.</p>
                  )}
                  {editingOrientacion && (
                    <div className="mt-3 space-y-2">
                      {editingOrientacion.servicios?.map((servicio) => (
                          <div key={servicio.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{servicio.titulo}</p>
                              <p className="text-xs text-neutral-500">{servicio.nomenclador?.codigoPrestacion}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveServicio(servicio.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      {(editingOrientacion.servicios?.length ?? 0) === 0 && (
                        <p className="text-sm text-neutral-500">Sin servicios nomenclados asociados</p>
                      )}
                    </div>
                  )}
                </div>

                {/* -- Servicios No Nomenclados -- */}
                <div>
                  <h4 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">No nomenclados</span>
                    Servicios No Nomenclados
                  </h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <SearchableSelect
                        options={servicioNoNomOptions}
                        value={selectedServicioNoNomId}
                        onChange={setSelectedServicioNoNomId}
                        placeholder="Seleccionar servicio no nomenclado..."
                      />
                    </div>
                    {editingOrientacion && (
                      <button
                        type="button"
                        onClick={handleAddServicioNoNom}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                  {!editingOrientacion && (
                    <p className="text-xs text-neutral-500 mt-2">Se asociará al guardar la orientación.</p>
                  )}
                  {editingOrientacion && (
                    <div className="mt-3 space-y-2">
                      {editingOrientacion.serviciosNoNomenclados?.map((snn) => (
                        <div key={snn.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{snn.titulo}</p>
                            <p className="text-xs text-neutral-500">
                              {snn.convenio === 'CON_CONVENIO' ? 'Con convenio' : 'Sin convenio'}
                              {snn.prestador?.efector?.nombre ? ` · ${snn.prestador.efector.nombre}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveServicioNoNom(snn.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                      {(editingOrientacion.serviciosNoNomenclados?.length ?? 0) === 0 && (
                        <p className="text-sm text-neutral-500">Sin servicios no nomenclados asociados</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Error:</span> {formError}
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : editingOrientacion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
