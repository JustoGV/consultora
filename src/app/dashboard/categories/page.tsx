'use client';

import { useState, useMemo } from 'react';
import { mockCategories } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: ''
  });

  // Filtrar categorías por administradora del usuario actual
  const userCategories = useMemo(() => {
    if (!user) return [];
    // Include global categories (administradoraId === 'global') for everyone
    if (user.administradoraId === 'global') {
      // Global admin sees all global categories
      return categories.filter(cat => cat.administradoraId === 'global');
    }
    return categories.filter(cat => cat.administradoraId === user.administradoraId || cat.administradoraId === 'global');
  }, [categories, user]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        code: category.code
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', code: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', code: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData }
          : cat
      ));
    } else {
      // Add new category with administradoraId
      const newCategory: Category = {
        id: String(categories.length + 1),
        ...formData,
        administradoraId: user?.administradoraId || ''
      };
      setCategories([...categories, newCategory]);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías de Discapacidad</h1>
          <p className="text-gray-600 mt-2">{user?.administradoraName} - {userCategories.length} categoría(s)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Código</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nombre</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Descripción</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {userCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{category.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{category.description}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    <PencilIcon className="w-5 h-5 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
