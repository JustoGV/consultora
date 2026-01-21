'use client';

import { useState, useMemo } from 'react';
import { mockNomenclators, mockCategories } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Nomenclator } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function NomenclatorsPage() {
  const { user } = useAuth();
  const [nomenclators, setNomenclators] = useState<Nomenclator[]>(mockNomenclators);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNomenclator, setEditingNomenclator] = useState<Nomenclator | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: '',
    price: 0
  });

  // Filtrar nomencladores por administradora del usuario actual
  const userNomenclators = useMemo(() => {
    if (!user) return [];
    if (user.administradoraId === 'global') {
      return nomenclators.filter(nom => nom.administradoraId === 'global');
    }
    return nomenclators.filter(nom => nom.administradoraId === user.administradoraId || nom.administradoraId === 'global');
  }, [nomenclators, user]);

  // Filtrar categorías por administradora del usuario actual
  const userCategories = useMemo(() => {
    if (!user) return [];
    if (user.administradoraId === 'global') {
      return mockCategories.filter(cat => cat.administradoraId === 'global');
    }
    return mockCategories.filter(cat => cat.administradoraId === user.administradoraId || cat.administradoraId === 'global');
  }, [user]);

  const handleOpenModal = (nomenclator?: Nomenclator) => {
    if (nomenclator) {
      setEditingNomenclator(nomenclator);
      setFormData({
        code: nomenclator.code,
        description: nomenclator.description,
        category: nomenclator.category,
        price: nomenclator.price || 0
      });
    } else {
      setEditingNomenclator(null);
      setFormData({ code: '', description: '', category: '', price: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNomenclator(null);
    setFormData({ code: '', description: '', category: '', price: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNomenclator) {
      // Update existing nomenclator
      setNomenclators(nomenclators.map(nom => 
        nom.id === editingNomenclator.id 
          ? { ...nom, ...formData }
          : nom
      ));
    } else {
      // Add new nomenclator with administradoraId
      const newNomenclator: Nomenclator = {
        id: String(nomenclators.length + 1),
        ...formData,
        administradoraId: user?.administradoraId || ''
      };
      setNomenclators([...nomenclators, newNomenclator]);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este nomenclador?')) {
      setNomenclators(nomenclators.filter(nom => nom.id !== id));
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nomencladores</h1>
          <p className="text-gray-600 mt-2">{user?.administradoraName} - {userNomenclators.length} nomenclador(es)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo Nomenclador</span>
        </button>
      </div>

      {/* Nomenclators Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Código</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Descripción</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoría</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Precio</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {userNomenclators.map((nomenclator) => (
              <tr key={nomenclator.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{nomenclator.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{nomenclator.description}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {nomenclator.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{formatPrice(nomenclator.price)}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    onClick={() => handleOpenModal(nomenclator)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    <PencilIcon className="w-5 h-5 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(nomenclator.id)}
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
              {editingNomenclator ? 'Editar Nomenclador' : 'Nuevo Nomenclador'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {userCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio (ARS)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingNomenclator ? 'Actualizar' : 'Crear'}
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
