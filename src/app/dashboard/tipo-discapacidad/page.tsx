'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TipoDiscapacidad, CreateTipoDiscapacidadDto } from '@/types';
import { tipoDiscapacidadService } from '@/services/tipoDiscapacidadService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { extractErrorMessage } from '@/lib/errorUtils';

export default function TipoDiscapacidadPage() {
  const { user } = useAuth();
  const [tiposDiscapacidad, setTiposDiscapacidad] = useState<TipoDiscapacidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoDiscapacidad | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateTipoDiscapacidadDto>({
    nombre: '',
    codigo: '',
    descripcion: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadTiposDiscapacidad();
  }, []);

  const loadTiposDiscapacidad = async () => {
    try {
      setLoading(true);
      const data = await tipoDiscapacidadService.getAll();
      setTiposDiscapacidad(data);
    } catch (error) {
      console.error('Error al cargar tipos de discapacidad:', error);
      alert('Error al cargar tipos de discapacidad');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tipo?: TipoDiscapacidad) => {
    setFormError('');
    setFieldErrors({});
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        nombre: tipo.nombre,
        codigo: tipo.codigo,
        descripcion: tipo.descripcion || '',
        administradoraId: tipo.administradoraId,
        activo: tipo.activo,
      });
    } else {
      setEditingTipo(null);
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
    setEditingTipo(null);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!formData.nombre) errors.nombre = 'Requerido';
    if (!formData.codigo) errors.codigo = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);

      if (editingTipo) {
        await tipoDiscapacidadService.update(editingTipo.id, formData);
      } else {
        await tipoDiscapacidadService.create(formData);
      }

      await loadTiposDiscapacidad();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este tipo de discapacidad?')) {
      return;
    }

    try {
      await tipoDiscapacidadService.delete(id);
      await loadTiposDiscapacidad();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Tipos de Discapacidad
          </h1>
          <p className="text-neutral-600 mt-2">
            Gestión de catálogo de tipos de discapacidad
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Tipo
        </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Administradora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {tiposDiscapacidad.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{tipo.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{tipo.nombre}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{tipo.descripcion || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{tipo.administradora?.nombre || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tipo.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tipo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(tipo)} className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(tipo.id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tiposDiscapacidad.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No hay tipos de discapacidad registrados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingTipo ? 'Editar Tipo de Discapacidad' : 'Nuevo Tipo de Discapacidad'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.codigo ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                  placeholder="MOTORA"
                  maxLength={50}
                />
                {fieldErrors.codigo && <p className="text-xs text-red-600 mt-1">{fieldErrors.codigo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.nombre ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                  placeholder="Motora"
                  maxLength={100}
                />
                {fieldErrors.nombre && <p className="text-xs text-red-600 mt-1">{fieldErrors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Descripción del tipo de discapacidad"
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
                <label htmlFor="activo" className="ml-2 text-sm text-neutral-700">Activo</label>
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
                  {saving ? 'Guardando...' : editingTipo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
