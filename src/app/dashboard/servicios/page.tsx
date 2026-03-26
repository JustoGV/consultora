'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Servicio, Categoria, Nomenclador, CreateServicioDto, TipoServicio } from '@/types';
import { serviciosService } from '@/services/serviciosService';
import { categoriaService } from '@/services/categoriaService';
import { nomencladorService } from '@/services/nomencladorService';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

export default function ServiciosPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nomencladores, setNomencladores] = useState<Nomenclador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

  const [formData, setFormData] = useState<CreateServicioDto>({
    titulo: '',
    categoriaId: '',
    nomencladorId: '',
    tipoServicio: 'NOMENCLADO',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [serviciosData, categoriasData, nomencladoresData] = await Promise.all([
        serviciosService.getAll(),
        categoriaService.getAll(),
        nomencladorService.getAll()
      ]);
      setServicios(serviciosData);
      setCategorias(categoriasData);
      setNomencladores(nomencladoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (servicio?: Servicio) => {
    if (servicio) {
      setEditingServicio(servicio);
      const tipo: TipoServicio = servicio.tipoServicio ?? (servicio.nomencladorId ? 'NOMENCLADO' : 'NO_NOMENCLADO');
      setFormData({
        titulo: servicio.titulo,
        categoriaId: servicio.categoriaId,
        nomencladorId: servicio.nomencladorId || '',
        tipoServicio: tipo,
      });
    } else {
      setEditingServicio(null);
      setFormData({
        titulo: '',
        categoriaId: '',
        nomencladorId: '',
        tipoServicio: 'NOMENCLADO',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingServicio(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.categoriaId || (formData.tipoServicio === 'NOMENCLADO' && !formData.nomencladorId)) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      if (editingServicio) {
        await serviciosService.update(editingServicio.id, formData);
      } else {
        await serviciosService.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      alert('Error al guardar servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;

    try {
      await serviciosService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar servicio');
    }
  };

  const filteredServicios = servicios.filter((servicio) => {
    const search = searchTerm.toLowerCase();
    return (
      servicio.titulo.toLowerCase().includes(search) ||
      servicio.categoria?.nombre?.toLowerCase().includes(search) ||
      servicio.nomenclador?.codigoPrestacion?.toLowerCase().includes(search)
    );
  });

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedServicios,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredServicios, itemsPerPage: 10 });

  const categoriaOptions = categorias.map((cat) => ({
    value: cat.id,
    label: cat.nombre
  }));

  const nomencladorOptions = nomencladores.map((nom) => ({
    value: nom.id,
    label: `${nom.codigoPrestacion} - ${nom.unidadMedida}`
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Servicios
          </h1>
          <p className="text-neutral-600 mt-2">Gestión de servicios asociados a categorías y nomencladores</p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Nuevo Servicio
          </button>
        )}
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por título, categoría o nomenclador..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nomenclador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedServicios.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-neutral-900">{servicio.titulo}</td>
                    <td className="px-6 py-4 text-sm">
                      {(() => {
                        const tipo = servicio.tipoServicio ?? (servicio.nomencladorId ? 'NOMENCLADO' : 'NO_NOMENCLADO');
                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tipo === 'NOMENCLADO' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {tipo === 'NOMENCLADO' ? 'Nomenclado' : 'No nomenclado'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{servicio.categoria?.nombre || '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {servicio.nomenclador?.codigoPrestacion || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          servicio.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(isSuperAdmin || isAdmin) ? (
                        <>
                          <button
                            onClick={() => handleOpenModal(servicio)}
                            className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(servicio.id)}
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

            {paginatedServicios.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No se encontraron servicios</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredServicios.length > 0 && (
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Tipo de Servicio *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipoServicio: 'NOMENCLADO', nomencladorId: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      formData.tipoServicio === 'NOMENCLADO'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    Nomenclado
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipoServicio: 'NO_NOMENCLADO', nomencladorId: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      formData.tipoServicio === 'NO_NOMENCLADO'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    No nomenclado
                  </button>
                </div>
              </div>

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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría *</label>
                <SearchableSelect
                  options={categoriaOptions}
                  value={formData.categoriaId}
                  onChange={(value) => setFormData({ ...formData, categoriaId: value })}
                  placeholder="Seleccionar categoría..."
                  required
                />
              </div>

              {formData.tipoServicio === 'NOMENCLADO' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nomenclador *</label>
                  <SearchableSelect
                    options={nomencladorOptions}
                    value={formData.nomencladorId || ''}
                    onChange={(value) => setFormData({ ...formData, nomencladorId: value })}
                    placeholder="Seleccionar nomenclador..."
                    required
                  />
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
                  {saving ? 'Guardando...' : editingServicio ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
