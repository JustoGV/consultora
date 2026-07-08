'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveAdministradoraId } from '@/contexts/ActiveAdministradoraContext';
import { nomencladorService } from '@/services/nomencladorService';
import { Nomenclador, CreateNomencladorDto } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { mapServerErrors } from '@/lib/errorUtils';
import { handleEnterAsTab } from '@/lib/formUtils';
import { notify } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useSuccessConfirm } from '@/components/ui/success-confirm';

export default function NomenclatorsPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const administradoraId = useActiveAdministradoraId();
  const confirm = useConfirm();
  const confirmSuccess = useSuccessConfirm();
  const [nomencladores, setNomencladores] = useState<Nomenclador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNomenclador, setEditingNomenclador] = useState<Nomenclador | null>(null);
  const [formData, setFormData] = useState<CreateNomencladorDto>({
    costoUnitario: 0,
    costoEtapa1: 0,
    costoEtapa2: 0,
    costoEtapa3: 0,
    fechaVigenciaActual: '',
    fechaVigenciaEtapa1: '',
    fechaVigenciaEtapa2: '',
    fechaVigenciaEtapa3: '',
    unidadMedida: '',
    administradoraId
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const nomencladoresData = await nomencladorService.getAll();
      setNomencladores(nomencladoresData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los nomencladores. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar nomenclador',
      description: 'Esta acción da de baja el nomenclador. ¿Querés continuar?',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    try {
      await nomencladorService.delete(id);
      await loadData();
      confirmSuccess('Nomenclador eliminado');
    } catch (err) {
      console.error('Error al eliminar nomenclador:', err);
      notify.error('No se pudo eliminar el nomenclador');
    }
  };

  const handleOpenModal = (nomenclador?: Nomenclador) => {
    setFormError('');
    if (nomenclador) {
      setEditingNomenclador(nomenclador);
      setFormData({
        costoUnitario: Number(nomenclador.costoUnitario),
        costoEtapa1: Number(nomenclador.costoEtapa1),
        costoEtapa2: Number(nomenclador.costoEtapa2),
        costoEtapa3: Number(nomenclador.costoEtapa3),
        fechaVigenciaActual: nomenclador.fechaVigenciaActual,
        fechaVigenciaEtapa1: nomenclador.fechaVigenciaEtapa1,
        fechaVigenciaEtapa2: nomenclador.fechaVigenciaEtapa2,
        fechaVigenciaEtapa3: nomenclador.fechaVigenciaEtapa3,
        unidadMedida: nomenclador.unidadMedida,
        administradoraId: nomenclador.administradoraId
      });
    } else {
      setEditingNomenclador(null);
      setFormData({
        costoUnitario: 0,
        costoEtapa1: 0,
        costoEtapa2: 0,
        costoEtapa3: 0,
        fechaVigenciaActual: '',
        fechaVigenciaEtapa1: '',
        fechaVigenciaEtapa2: '',
        fechaVigenciaEtapa3: '',
        unidadMedida: '',
        administradoraId
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNomenclador(null);
    setFormData({
      costoUnitario: 0,
      costoEtapa1: 0,
      costoEtapa2: 0,
      costoEtapa3: 0,
      fechaVigenciaActual: '',
      fechaVigenciaEtapa1: '',
      fechaVigenciaEtapa2: '',
      fechaVigenciaEtapa3: '',
      unidadMedida: '',
      administradoraId
    });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingNomenclador) {
        await nomencladorService.update(editingNomenclador.id, formData);
      } else {
        await nomencladorService.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar nomenclador:', err);
      const { formError: gf } = mapServerErrors(err, Object.keys(formData));
      setFormError(gf ?? 'Error al guardar el nomenclador');
    } finally {
      setSaving(false);
    }
  };

  const filteredNomencladores = nomencladores.filter(nom => {
    const search = searchTerm.toLowerCase();
    return (
      nom.codigoPrestacion.toLowerCase().includes(search) ||
      nom.unidadMedida.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Nomencladores
          </h1>
          <p className="text-neutral-600 mt-2">
            {(isSuperAdmin || isAdmin) ? 'Gestión de nomencladores' : 'Consulta de nomencladores (solo lectura)'}
          </p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Nomenclador
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por código o unidad de medida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="premium-card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-neutral-600 mt-4">Cargando nomencladores...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm font-medium text-blue-800">Total Nomencladores</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{nomencladores.length}</p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm font-medium text-green-800">Activos</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {nomencladores.filter(n => n.activo).length}
              </p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-amber-50 to-amber-100">
              <p className="text-sm font-medium text-amber-800">Resultados</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">{filteredNomencladores.length}</p>
            </div>
          </div>

          {/* Tabla de Nomencladores */}
          {filteredNomencladores.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <p className="text-neutral-500">No se encontraron nomencladores</p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Costo Actual
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Costo Etapa 3
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        % Aumento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Vigencia Actual
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredNomencladores.map((nomenclador) => (
                      <tr key={nomenclador.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-900">
                          {nomenclador.codigoPrestacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {nomenclador.unidadMedida}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          ${parseFloat(nomenclador.costoUnitario).toLocaleString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          ${parseFloat(nomenclador.costoEtapa3).toLocaleString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {parseFloat(nomenclador.porcentajeAumentoTotal).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {new Date(nomenclador.fechaVigenciaActual).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            nomenclador.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {nomenclador.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {(isSuperAdmin || isAdmin) ? (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleOpenModal(nomenclador)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(nomenclador.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">Solo lectura</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingNomenclador ? 'Editar Nomenclador' : 'Nuevo Nomenclador'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleEnterAsTab} autoComplete="off" className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Medida *
                  </label>
                  <input
                    id="unidadMedida"
                    type="text"
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    placeholder="Ej: hora, sesión"
                  />
                </div>

                <div>
                  <label htmlFor="costoUnitario" className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Unitario *
                  </label>
                  <input
                    id="costoUnitario"
                    type="number"
                    step="0.01"
                    value={formData.costoUnitario}
                    onChange={(e) => setFormData({ ...formData, costoUnitario: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="costoEtapa1" className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Etapa 1 *
                  </label>
                  <input
                    id="costoEtapa1"
                    type="number"
                    step="0.01"
                    value={formData.costoEtapa1}
                    onChange={(e) => setFormData({ ...formData, costoEtapa1: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="costoEtapa2" className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Etapa 2 *
                  </label>
                  <input
                    id="costoEtapa2"
                    type="number"
                    step="0.01"
                    value={formData.costoEtapa2}
                    onChange={(e) => setFormData({ ...formData, costoEtapa2: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="costoEtapa3" className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Etapa 3 *
                  </label>
                  <input
                    id="costoEtapa3"
                    type="number"
                    step="0.01"
                    value={formData.costoEtapa3}
                    onChange={(e) => setFormData({ ...formData, costoEtapa3: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fechaVigenciaActual" className="block text-sm font-medium text-gray-700 mb-2">
                    Vigencia Actual *
                  </label>
                  <input
                    id="fechaVigenciaActual"
                    type="date"
                    value={formData.fechaVigenciaActual}
                    onChange={(e) => setFormData({ ...formData, fechaVigenciaActual: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fechaVigenciaEtapa1" className="block text-sm font-medium text-gray-700 mb-2">
                    Vigencia Etapa 1 *
                  </label>
                  <input
                    id="fechaVigenciaEtapa1"
                    type="date"
                    value={formData.fechaVigenciaEtapa1}
                    onChange={(e) => setFormData({ ...formData, fechaVigenciaEtapa1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fechaVigenciaEtapa2" className="block text-sm font-medium text-gray-700 mb-2">
                    Vigencia Etapa 2 *
                  </label>
                  <input
                    id="fechaVigenciaEtapa2"
                    type="date"
                    value={formData.fechaVigenciaEtapa2}
                    onChange={(e) => setFormData({ ...formData, fechaVigenciaEtapa2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fechaVigenciaEtapa3" className="block text-sm font-medium text-gray-700 mb-2">
                    Vigencia Etapa 3 *
                  </label>
                  <input
                    id="fechaVigenciaEtapa3"
                    type="date"
                    value={formData.fechaVigenciaEtapa3}
                    onChange={(e) => setFormData({ ...formData, fechaVigenciaEtapa3: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Error:</span> {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingNomenclador ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
