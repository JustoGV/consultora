'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Efector, CreateEfectorDto, UpdateEfectorDto, TipoEfector } from '@/types';
import { efectoresService } from '@/services/efectoresService';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

type FormData = CreateEfectorDto;

const emptyForm = (administradoraId: string): FormData => ({
  nombre: '',
  tipo: 'PERSONA_JURIDICA',
  cuit: '',
  telefono: '',
  email: '',
  direccion: '',
  administradoraId,
});

export default function EfectoresPage() {
  const { isSuperAdmin, isAdmin, user } = useAuth();
  const [efectores, setEfectores] = useState<Efector[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEfector, setEditingEfector] = useState<Efector | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm(''));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await efectoresService.getAll();
      setEfectores(data);
    } catch (error) {
      console.error('Error al cargar efectores:', error);
      alert('Error al cargar efectores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (efector?: Efector) => {
    if (efector) {
      setEditingEfector(efector);
      setFormData({
        nombre: efector.nombre,
        tipo: efector.tipo,
        cuit: efector.cuit ?? '',
        telefono: efector.telefono ?? '',
        email: efector.email ?? '',
        direccion: efector.direccion ?? '',
        administradoraId: efector.administradoraId,
      });
    } else {
      setEditingEfector(null);
      setFormData(emptyForm(user?.administradoraId ?? ''));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEfector(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.tipo) {
      alert('Nombre y tipo son obligatorios');
      return;
    }
    try {
      setSaving(true);
      if (editingEfector) {
        const updateData: UpdateEfectorDto = {
          nombre: formData.nombre,
          tipo: formData.tipo,
          cuit: formData.cuit || undefined,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
          direccion: formData.direccion || undefined,
        };
        await efectoresService.update(editingEfector.id, updateData);
      } else {
        await efectoresService.create({
          ...formData,
          cuit: formData.cuit || undefined,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
          direccion: formData.direccion || undefined,
        });
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar efector:', error);
      alert('Error al guardar efector');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de dar de baja este efector?')) return;
    try {
      await efectoresService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar efector');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await efectoresService.restore(id);
      await loadData();
    } catch (error) {
      console.error('Error al restaurar:', error);
      alert('Error al restaurar efector');
    }
  };

  const filteredEfectores = efectores.filter((e) => {
    const search = searchTerm.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(search) ||
      e.cuit?.toLowerCase().includes(search) ||
      e.email?.toLowerCase().includes(search) ||
      e.telefono?.toLowerCase().includes(search)
    );
  });

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedEfectores,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({ items: filteredEfectores, itemsPerPage: 10 });

  const field = (label: string, key: keyof FormData, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={(formData[key] as string) ?? ''}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        required={required}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Efectores
          </h1>
          <p className="text-neutral-600 mt-2">
            Organizaciones y profesionales que brindan servicios de salud
          </p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Efector
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CUIT, email o teléfono..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">CUIT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  {(isSuperAdmin || isAdmin) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedEfectores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      No se encontraron efectores
                    </td>
                  </tr>
                ) : (
                  paginatedEfectores.map((efector) => (
                    <tr key={efector.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {efector.tipo === 'PERSONA_JURIDICA' ? (
                            <BuildingOfficeIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-neutral-900">{efector.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {efector.tipo === 'PERSONA_JURIDICA' ? 'Persona Jurídica' : 'Persona Física'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{efector.cuit ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{efector.telefono ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{efector.email ?? '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            efector.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {efector.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {(isSuperAdmin || isAdmin) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {efector.activo ? (
                              <>
                                <button
                                  onClick={() => handleOpenModal(efector)}
                                  className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(efector.id)}
                                  className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Dar de baja"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestore(efector.id)}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingEfector ? 'Editar Efector' : 'Nuevo Efector'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {field('Nombre', 'nombre', 'text', true)}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoEfector })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="PERSONA_JURIDICA">Persona Jurídica</option>
                  <option value="PERSONA_FISICA">Persona Física</option>
                </select>
              </div>

              {field('CUIT', 'cuit')}
              {field('Teléfono', 'telefono', 'tel')}
              {field('Email', 'email', 'email')}
              {field('Dirección', 'direccion')}

              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Administradora ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.administradoraId}
                    onChange={(e) => setFormData({ ...formData, administradoraId: e.target.value })}
                    placeholder="UUID de la administradora"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
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
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
                  {editingEfector ? 'Guardar cambios' : 'Crear efector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
