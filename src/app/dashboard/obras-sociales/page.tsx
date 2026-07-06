'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ObraSocial, CreateObraSocialDto } from '@/types';
import { obrasSocialesService } from '@/services/obrasSocialesService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractErrorMessage, mapServerErrors } from '@/lib/errorUtils';
import { handleEnterAsTab } from '@/lib/formUtils';

export default function ObrasSocialesPage() {
  const { user } = useAuth();
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObraSocial, setEditingObraSocial] = useState<ObraSocial | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateObraSocialDto>({
    nombre: '',
    sigla: '',
    codigo: '',
    descripcion: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadObrasSociales();
  }, []);

  const loadObrasSociales = async () => {
    try {
      setLoading(true);
      const data = await obrasSocialesService.getAll();
      setObrasSociales(data);
    } catch (error) {
      console.error('Error al cargar obras sociales:', error);
      alert('Error al cargar obras sociales');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (obraSocial?: ObraSocial) => {
    setFormError('');
    setFieldErrors({});
    if (obraSocial) {
      setEditingObraSocial(obraSocial);
      setFormData({
        nombre: obraSocial.nombre,
        sigla: obraSocial.sigla || '',
        codigo: obraSocial.codigo || '',
        descripcion: obraSocial.descripcion || '',
        administradoraId: obraSocial.administradoraId,
        activo: obraSocial.activo,
      });
    } else {
      setEditingObraSocial(null);
      setFormData({
        nombre: '',
        sigla: '',
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
    setEditingObraSocial(null);
    setFormData({
      nombre: '',
      sigla: '',
      codigo: '',
      descripcion: '',
      administradoraId: user?.administradoraId || '',
      activo: true,
    });
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.nombre) errors.nombre = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        sigla: formData.sigla || undefined,
        codigo: formData.codigo || undefined,
        descripcion: formData.descripcion || undefined,
      };

      if (editingObraSocial) {
        await obrasSocialesService.update(editingObraSocial.id, dataToSend);
      } else {
        await obrasSocialesService.create(dataToSend);
      }

      await loadObrasSociales();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(formData));
      // El backend devuelve 409 de duplicado como mensaje plano (no array de ValidationPipe):
      // mapServerErrors lo deja en formError. Lo mostramos también en el campo nombre.
      if (gf && gf.toLowerCase().includes('ya existe')) {
        fe.nombre = gf;
      } else if (gf) {
        setFormError(gf);
      }
      setFieldErrors((prev) => ({ ...prev, ...fe }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta obra social?')) {
      return;
    }

    try {
      await obrasSocialesService.delete(id);
      await loadObrasSociales();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(extractErrorMessage(error));
    }
  };

  const filteredObrasSociales = useMemo(() =>
    obrasSociales.filter((os) =>
      os.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (os.sigla || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (os.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [obrasSociales, searchTerm]);

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedObrasSociales,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredObrasSociales, itemsPerPage: 10 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Obras Sociales
          </h1>
          <p className="text-neutral-600 mt-2">
            Gestión de catálogo de obras sociales / financiadores
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nueva Obra Social
        </button>
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, sigla o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Sigla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Activo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedObrasSociales.map((obraSocial) => (
                  <tr key={obraSocial.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {obraSocial.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {obraSocial.sigla || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {obraSocial.codigo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          obraSocial.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {obraSocial.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(obraSocial)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(obraSocial.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedObrasSociales.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">
                  {obrasSociales.length === 0
                    ? 'No hay obras sociales registradas'
                    : 'No se encontraron obras sociales con ese criterio'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Paginación */}
        {!loading && filteredObrasSociales.length > 0 && (
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
                {editingObraSocial ? 'Editar Obra Social' : 'Nueva Obra Social'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleEnterAsTab} autoComplete="off" className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.nombre ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                  placeholder="IAPOS"
                  maxLength={200}
                  autoComplete="off"
                />
                {fieldErrors.nombre && <p className="text-xs text-red-600 mt-1">{fieldErrors.nombre}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Sigla
                  </label>
                  <input
                    type="text"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.sigla ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    placeholder="IAPOS"
                    maxLength={50}
                    autoComplete="off"
                  />
                  {fieldErrors.sigla && <p className="text-xs text-red-600 mt-1">{fieldErrors.sigla}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.codigo ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    placeholder="IAPOS-SF"
                    maxLength={50}
                    autoComplete="off"
                  />
                  {fieldErrors.codigo && <p className="text-xs text-red-600 mt-1">{fieldErrors.codigo}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descripción de la obra social"
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
                  {saving ? 'Guardando...' : editingObraSocial ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
