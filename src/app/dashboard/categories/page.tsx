'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { categoriaService } from '@/services/categoriaService';
import { Categoria, CreateCategoriaDto } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CategoriesPage() {
  const { isSuperAdmin } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState<CreateCategoriaDto>({
    nombre: '',
    descripcion: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await categoriaService.getAll();
      
      // Por ahora mostrar todas - el backend ya filtra por administradora
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar las categorías. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;
    
    try {
      await categoriaService.delete(id);
      await loadCategorias();
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      alert('Error al eliminar la categoría');
    }
  };

  const handleOpenModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || ''
      });
    } else {
      setEditingCategoria(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategoria(null);
    setFormData({
      nombre: '',
      descripcion: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCategoria) {
        await categoriaService.update(editingCategoria.id, formData);
      } else {
        await categoriaService.create(formData);
      }
      await loadCategorias();
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      alert('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategorias = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Categorías
          </h1>
          <p className="text-neutral-600 mt-2">
            {isSuperAdmin ? 'Gestión global de categorías' : 'Consulta de categorías (solo lectura)'}
          </p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Categoría
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
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
          <p className="text-neutral-600 mt-4">Cargando categorías...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-sm font-medium text-blue-800">Total Categorías</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{categorias.length}</p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-sm font-medium text-green-800">Activas</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {categorias.filter(c => c.activo).length}
              </p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-amber-50 to-amber-100">
              <p className="text-sm font-medium text-amber-800">Resultados</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">{filteredCategorias.length}</p>
            </div>
          </div>

          {/* Lista de Categorías */}
          {filteredCategorias.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <p className="text-neutral-500">No se encontraron categorías</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategorias.map((categoria) => (
                <div key={categoria.id} className="premium-card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900">{categoria.nombre}</h3>
                      {categoria.descripcion && (
                        <p className="text-sm text-neutral-600 mt-1">{categoria.descripcion}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      categoria.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-neutral-200">
                    {isSuperAdmin ? (
                      <>
                        <button 
                          onClick={() => handleOpenModal(categoria)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(categoria.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <div className="w-full px-3 py-2 text-sm text-center text-neutral-500 bg-neutral-50 rounded-lg">
                        Solo lectura
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  placeholder="Ej: Categoría A"
                />
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
                  {saving ? 'Guardando...' : editingCategoria ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
