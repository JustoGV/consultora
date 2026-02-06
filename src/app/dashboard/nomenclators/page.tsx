'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { nomencladorService } from '@/services/nomencladorService';
import { categoriaService } from '@/services/categoriaService';
import { Nomenclador, Categoria, CreateNomencladorDto } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function NomenclatorsPage() {
  const { isSuperAdmin, user } = useAuth();
  const [nomencladores, setNomencladores] = useState<Nomenclador[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNomenclador, setEditingNomenclador] = useState<Nomenclador | null>(null);
  const [formData, setFormData] = useState<CreateNomencladorDto>({
    nombre: '',
    descripcion: '',
    codigoPrestacion: '',
    categoriaId: '',
    administradoraId: user?.administradoraId || 'global'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [nomencladoresData, categoriasData] = await Promise.all([
        nomencladorService.getAll(),
        categoriaService.getAll()
      ]);
      
      setNomencladores(nomencladoresData);
      setCategorias(categoriasData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los nomencladores. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este nomenclador?')) return;
    
    try {
      await nomencladorService.delete(id);
      await loadData();
    } catch (err) {
      console.error('Error al eliminar nomenclador:', err);
      alert('Error al eliminar el nomenclador');
    }
  };

  const handleOpenModal = (nomenclador?: Nomenclador) => {
    if (nomenclador) {
      setEditingNomenclador(nomenclador);
      setFormData({
        nombre: nomenclador.nombre,
        descripcion: nomenclador.descripcion || '',
        codigoPrestacion: nomenclador.codigoPrestacion || '',
        categoriaId: nomenclador.categoriaId,
        administradoraId: nomenclador.administradoraId
      });
    } else {
      setEditingNomenclador(null);
      setFormData({
        nombre: '',
        descripcion: '',
        codigoPrestacion: '',
        categoriaId: categorias.length > 0 ? categorias[0].id : '',
        administradoraId: user?.administradoraId || 'global'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNomenclador(null);
    setFormData({
      nombre: '',
      descripcion: '',
      codigoPrestacion: '',
      categoriaId: '',
      administradoraId: user?.administradoraId || 'global'
    });
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
      alert('Error al guardar el nomenclador');
    } finally {
      setSaving(false);
    }
  };

  const getCategoriaName = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nombre || 'Sin categoría';
  };

  const filteredNomencladores = nomencladores.filter(nom => {
    const matchesSearch = 
      nom.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nom.codigoPrestacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nom.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = !selectedCategoria || nom.categoriaId === selectedCategoria;
    
    return matchesSearch && matchesCategoria;
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
            {isSuperAdmin ? 'Gestión global de nomencladores' : 'Consulta de nomencladores (solo lectura)'}
          </p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Nomenclador
          </button>
        )}
      </div>

      {/* Buscador y Filtros */}
      <div className="premium-card p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
              showFilters 
                ? 'bg-primary-50 border-primary-500 text-primary-700' 
                : 'border-neutral-300 text-neutral-700 hover:border-primary-400'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtros
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <div className="pt-4 border-t border-neutral-200 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Categoría
                </label>
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoria('');
                  }}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        )}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="premium-card p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-sm font-medium text-purple-800">Categorías</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{categorias.length}</p>
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
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        % Aumento
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-neutral-900">
                            {nomenclador.codigoPrestacion || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{nomenclador.nombre}</p>
                            {nomenclador.descripcion && (
                              <p className="text-xs text-neutral-500 mt-1">{nomenclador.descripcion}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {getCategoriaName(nomenclador.categoriaId)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {nomenclador.porcentajeAumentoTotal ? (
                            <span className="text-sm font-semibold text-green-600">
                              +{nomenclador.porcentajeAumentoTotal}%
                            </span>
                          ) : (
                            <span className="text-sm text-neutral-400">-</span>
                          )}
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
                          {isSuperAdmin ? (
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    placeholder="Ej: Consulta médica"
                  />
                </div>

                <div>
                  <label htmlFor="codigoPrestacion" className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Prestación
                  </label>
                  <input
                    id="codigoPrestacion"
                    type="text"
                    value={formData.codigoPrestacion}
                    onChange={(e) => setFormData({ ...formData, codigoPrestacion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: 420101"
                  />
                </div>

                <div>
                  <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    id="categoriaId"
                    value={formData.categoriaId}
                    onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="porcentajeAumentoTotal" className="block text-sm font-medium text-gray-700 mb-2">
                    % Aumento Total
                  </label>
                  <input
                    id="porcentajeAumentoTotal"
                    type="number"
                    step="0.01"
                    value={formData.porcentajeAumentoTotal || ''}
                    onChange={(e) => setFormData({ ...formData, porcentajeAumentoTotal: parseFloat(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: 15.50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción opcional..."
                />
              </div>

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
