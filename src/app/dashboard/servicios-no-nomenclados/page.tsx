'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ServicioNoNomenclado,
  CreateServicioNoNomencladoDto,
  UpdateServicioNoNomencladoDto,
  ConvenioServicio,
  Prestador,
} from '@/types';
import { serviciosNoNomencladosService } from '@/services/serviciosNoNomencladosService';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import api from '@/lib/axios';
import { extractErrorMessage } from '@/lib/errorUtils';

export default function ServiciosNoNomencladosPage() {
  const { isSuperAdmin, isAdmin, user } = useAuth();
  const [servicios, setServicios] = useState<ServicioNoNomenclado[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioNoNomenclado | null>(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateServicioNoNomencladoDto>({
    titulo: '',
    convenio: 'CON_CONVENIO',
    prestadorId: '',
    administradoraId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [serviciosData, prestadoresData] = await Promise.all([
        serviciosNoNomencladosService.getAll(),
        api.get<Prestador[]>('/prestadores').then((r) => r.data).catch(() => []),
      ]);
      setServicios(serviciosData);
      setPrestadores(prestadoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar servicios no nomenclados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (servicio?: ServicioNoNomenclado) => {
    setFormError('');
    setFieldErrors({});
    if (servicio) {
      setEditingServicio(servicio);
      setFormData({
        titulo: servicio.titulo,
        convenio: servicio.convenio,
        prestadorId: servicio.prestadorId,
        administradoraId: servicio.administradoraId,
      });
    } else {
      setEditingServicio(null);
      setFormData({
        titulo: '',
        convenio: 'CON_CONVENIO',
        prestadorId: '',
        administradoraId: user?.administradoraId ?? '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingServicio(null);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.titulo) errors.titulo = 'Requerido';
    if (!formData.prestadorId) errors.prestadorId = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      if (editingServicio) {
        const updateData: UpdateServicioNoNomencladoDto = {
          titulo: formData.titulo,
          convenio: formData.convenio,
          prestadorId: formData.prestadorId,
        };
        await serviciosNoNomencladosService.update(editingServicio.id, updateData);
      } else {
        await serviciosNoNomencladosService.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de dar de baja este servicio no nomenclado?')) return;
    try {
      await serviciosNoNomencladosService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar servicio no nomenclado');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await serviciosNoNomencladosService.restore(id);
      await loadData();
    } catch (error) {
      console.error('Error al restaurar:', error);
      alert('Error al restaurar servicio no nomenclado');
    }
  };

  const filteredServicios = servicios.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.titulo.toLowerCase().includes(search) ||
      s.prestador?.efector?.nombre?.toLowerCase().includes(search) ||
      s.convenio.toLowerCase().includes(search)
    );
  });

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedServicios,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({ items: filteredServicios, itemsPerPage: 10 });

  const getConvenioLabel = (convenio: ConvenioServicio) => {
    return convenio === 'CON_CONVENIO' ? 'Con Convenio' : 'Sin Convenio';
  };

  const getConvenioClass = (convenio: ConvenioServicio) => {
    return convenio === 'CON_CONVENIO'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Servicios No Nomenclados
          </h1>
          <p className="text-neutral-600 mt-2">
            Gestión de prestaciones de salud fuera del nomenclador oficial
          </p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Servicio
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por título, prestador o convenio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabla */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Convenio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Prestador / Efector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Estado
                  </th>
                  {(isSuperAdmin || isAdmin) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedServicios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      No se encontraron servicios no nomenclados
                    </td>
                  </tr>
                ) : (
                  paginatedServicios.map((servicio) => (
                    <tr key={servicio.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                        {servicio.titulo}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConvenioClass(servicio.convenio)}`}
                        >
                          {getConvenioLabel(servicio.convenio)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {servicio.prestador?.efector?.nombre ?? (
                          <span className="text-neutral-400 italic">Sin efector</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            servicio.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {servicio.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {(isSuperAdmin || isAdmin) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {servicio.activo ? (
                              <>
                                <button
                                  onClick={() => handleOpenModal(servicio)}
                                  className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(servicio.id)}
                                  className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Dar de baja"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestore(servicio.id)}
                                className="p-1.5 text-neutral-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Restaurar"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalItems > 0 && (
          <div className="border-t border-neutral-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingServicio ? 'Editar Servicio No Nomenclado' : 'Nuevo Servicio No Nomenclado'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Kinesiología motora"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Convenio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Convenio <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.convenio}
                  onChange={(e) =>
                    setFormData({ ...formData, convenio: e.target.value as ConvenioServicio })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="CON_CONVENIO">Con Convenio</option>
                  <option value="SIN_CONVENIO">Sin Convenio</option>
                </select>
              </div>

              {/* Prestador */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Prestador <span className="text-red-500">*</span>
                </label>
                {prestadores.length > 0 ? (
                  <select
                    value={formData.prestadorId}
                    onChange={(e) => setFormData({ ...formData, prestadorId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar prestador...</option>
                    {prestadores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.efector?.nombre ?? p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.prestadorId}
                    onChange={(e) => setFormData({ ...formData, prestadorId: e.target.value })}
                    placeholder="UUID del prestador"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                )}
              </div>

              {/* Administradora (solo superadmin) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Administradora ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.administradoraId}
                    onChange={(e) =>
                      setFormData({ ...formData, administradoraId: e.target.value })
                    }
                    placeholder="UUID de la administradora"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Error:</span> {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : null}
                  {editingServicio ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
