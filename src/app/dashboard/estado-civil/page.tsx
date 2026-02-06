'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EstadoCivil, CreateEstadoCivilDto } from '@/types';
import { estadoCivilService } from '@/services/estadoCivilService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

export default function EstadoCivilPage() {
  const { user } = useAuth();
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstadoCivil, setEditingEstadoCivil] = useState<EstadoCivil | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CreateEstadoCivilDto>({
    nombre: '',
    codigo: '',
    descripcion: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadEstadosCiviles();
  }, []);

  const loadEstadosCiviles = async () => {
    try {
      setLoading(true);
      const data = await estadoCivilService.getAll();
      setEstadosCiviles(data);
    } catch (error) {
      console.error('Error al cargar estados civiles:', error);
      alert('Error al cargar estados civiles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (estadoCivil?: EstadoCivil) => {
    if (estadoCivil) {
      setEditingEstadoCivil(estadoCivil);
      setFormData({
        nombre: estadoCivil.nombre,
        codigo: estadoCivil.codigo,
        descripcion: estadoCivil.descripcion || '',
        administradoraId: estadoCivil.administradoraId,
        activo: estadoCivil.activo,
      });
    } else {
      setEditingEstadoCivil(null);
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEstadoCivil(null);
    setFormData({
      nombre: '',
      codigo: '',
      descripcion: '',
      administradoraId: user?.administradoraId || '',
      activo: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.codigo) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      if (editingEstadoCivil) {
        await estadoCivilService.update(editingEstadoCivil.id, formData);
      } else {
        await estadoCivilService.create(formData);
      }

      await loadEstadosCiviles();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar estado civil');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este estado civil?')) {
      return;
    }

    try {
      await estadoCivilService.delete(id);
      await loadEstadosCiviles();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar estado civil');
    }
  };

  // Paginación
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedEstados,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: estadosCiviles, itemsPerPage: 10 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Estados Civiles
          </h1>
          <p className="text-neutral-600 mt-2">
            Gestión de catálogo de estados civiles
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Estado Civil
        </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Administradora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedEstados.map((estadoCivil) => (
                  <tr key={estadoCivil.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {estadoCivil.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {estadoCivil.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {estadoCivil.descripcion || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {estadoCivil.administradora?.nombre || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          estadoCivil.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {estadoCivil.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(estadoCivil)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(estadoCivil.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedEstados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No hay estados civiles registrados</p>
              </div>
            )}
          </div>
        )}

        {/* Paginación */}
        {!loading && estadosCiviles.length > 0 && (
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingEstadoCivil ? 'Editar Estado Civil' : 'Nuevo Estado Civil'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SOLTERO"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Soltero/a"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descripción del estado civil"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-neutral-700">
                  Activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
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
                  {saving ? 'Guardando...' : editingEstadoCivil ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
