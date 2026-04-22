'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TercerosVinculado, CreateTercerosVinculadoDto } from '@/types';
import { tercerosVinculadoService } from '@/services/tercerosVinculadoService';
import { personaTercerosService } from '@/services/personaTercerosService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';
import { extractErrorMessage } from '@/lib/errorUtils';

export default function TercerosVinculadosPage() {
  const { user } = useAuth();
  const [terceros, setTerceros] = useState<TercerosVinculado[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTercero, setEditingTercero] = useState<TercerosVinculado | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateTercerosVinculadoDto>({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    edad: 0,
    telefono: '',
    email: '',
    direccion: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadTerceros();
  }, []);

  const loadTerceros = async () => {
    try {
      setLoading(true);
      const data = await tercerosVinculadoService.getAll();
      setTerceros(data);
    } catch (error) {
      console.error('Error al cargar terceros:', error);
      alert('Error al cargar terceros vinculados');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleOpenModal = (tercero?: TercerosVinculado) => {
    setFormError('');
    setFieldErrors({});
    if (tercero) {
      setEditingTercero(tercero);
      setFormData({
        nombre: tercero.nombre,
        apellido: tercero.apellido,
        dni: tercero.dni,
        fechaNacimiento: tercero.fechaNacimiento.split('T')[0],
        edad: tercero.edad,
        telefono: tercero.telefono || '',
        email: tercero.email || '',
        direccion: tercero.direccion || '',
        administradoraId: tercero.administradoraId,
        activo: tercero.activo,
      });
    } else {
      setEditingTercero(null);
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        fechaNacimiento: '',
        edad: 0,
        telefono: '',
        email: '',
        direccion: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTercero(null);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.nombre) errors.nombre = 'Requerido';
    if (!formData.apellido) errors.apellido = 'Requerido';
    if (!formData.dni) errors.dni = 'Requerido';
    if (!formData.fechaNacimiento) errors.fechaNacimiento = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        direccion: formData.direccion || undefined,
        edad: calculateAge(formData.fechaNacimiento),
      };

      if (editingTercero) {
        await tercerosVinculadoService.update(editingTercero.id, dataToSend);
      } else {
        await tercerosVinculadoService.create(dataToSend);
      }

      await loadTerceros();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const extractErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosError.response?.data?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }
    return extractErrorMessage(error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este tercero vinculado? También se eliminarán sus vínculos con afiliados.')) return;

    try {
      // Primero eliminar todos los vínculos persona-terceros que referencian este tercero
      const relaciones = await personaTercerosService.getAll();
      const relacionadas = relaciones.filter((r) => r.tercerosVinculadoId === id);
      for (const rel of relacionadas) {
        await personaTercerosService.delete(rel.id);
      }
      await tercerosVinculadoService.delete(id);
      await loadTerceros();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(extractErrorMessage(error));
    }
  };

  const filteredTerceros = terceros.filter(
    (tercero) =>
      tercero.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tercero.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tercero.dni.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Terceros Vinculados
          </h1>
          <p className="text-neutral-600 mt-2">Gestión de terceros vinculados a afiliados</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Tercero
        </button>
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <UsersIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">DNI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredTerceros.map((tercero) => (
                  <tr key={tercero.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {tercero.apellido}, {tercero.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{tercero.dni}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{tercero.edad} años</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{tercero.telefono || '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{tercero.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tercero.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tercero.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(tercero)}
                        className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(tercero.id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTerceros.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No se encontraron terceros vinculados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingTercero ? 'Editar Tercero' : 'Nuevo Tercero'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.nombre ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    maxLength={100}
                  />
                  {fieldErrors.nombre && <p className="text-xs text-red-600 mt-1">{fieldErrors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.apellido ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    maxLength={100}
                  />
                  {fieldErrors.apellido && <p className="text-xs text-red-600 mt-1">{fieldErrors.apellido}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">DNI *</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.dni ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    maxLength={20}
                  />
                  {fieldErrors.dni && <p className="text-xs text-red-600 mt-1">{fieldErrors.dni}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.fechaNacimiento ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                  />
                  {fieldErrors.fechaNacimiento && <p className="text-xs text-red-600 mt-1">{fieldErrors.fechaNacimiento}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={100}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={255}
                  />
                </div>

                <div className="md:col-span-2 flex items-center">
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
                  {saving ? 'Guardando...' : editingTercero ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
