'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PersonaTercerosVinculado, CreatePersonaTercerosVinculadoDto, Afiliado, TercerosVinculado } from '@/types';
import { personaTercerosService } from '@/services/personaTercerosService';
import { afiliadosService } from '@/services/afiliadosService';
import { tercerosVinculadoService } from '@/services/tercerosVinculadoService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import { extractErrorMessage, mapServerErrors } from '@/lib/errorUtils';
import { handleEnterAsTab } from '@/lib/formUtils';

export default function PersonaTercerosPage() {
  const { user } = useAuth();
  const [relaciones, setRelaciones] = useState<PersonaTercerosVinculado[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [terceros, setTerceros] = useState<TercerosVinculado[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelacion, setEditingRelacion] = useState<PersonaTercerosVinculado | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreatePersonaTercerosVinculadoDto>({
    tipoRelacion: '',
    observaciones: '',
    afiliadoId: '',
    tercerosVinculadoId: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [relacionesData, afiliadosData, tercerosData] = await Promise.all([
        personaTercerosService.getAll(),
        afiliadosService.getAll(),
        tercerosVinculadoService.getAll(),
      ]);
      setRelaciones(relacionesData);
      setAfiliados(afiliadosData);
      setTerceros(tercerosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (relacion?: PersonaTercerosVinculado) => {
    setFormError('');
    setFieldErrors({});
    if (relacion) {
      setEditingRelacion(relacion);
      setFormData({
        tipoRelacion: relacion.tipoRelacion,
        observaciones: relacion.observaciones || '',
        afiliadoId: relacion.afiliadoId,
        tercerosVinculadoId: relacion.tercerosVinculadoId,
        administradoraId: relacion.administradoraId,
        activo: relacion.activo,
      });
    } else {
      setEditingRelacion(null);
      setFormData({
        tipoRelacion: '',
        observaciones: '',
        afiliadoId: '',
        tercerosVinculadoId: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRelacion(null);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.tipoRelacion) errors.tipoRelacion = 'Requerido';
    if (!formData.afiliadoId) errors.afiliadoId = 'Requerido';
    if (!formData.tercerosVinculadoId) errors.tercerosVinculadoId = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);

      if (editingRelacion) {
        await personaTercerosService.update(editingRelacion.id, formData);
      } else {
        await personaTercerosService.create(formData);
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(formData));
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (gf) setFormError(gf);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta relación?')) return;

    try {
      await personaTercerosService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(extractErrorMessage(error));
    }
  };

  const getAfiliadoNombre = (afiliadoId: string) => {
    const afiliado = afiliados.find((a) => a.id === afiliadoId);
    return afiliado ? `${afiliado.apellido}, ${afiliado.nombre}` : '-';
  };

  const getTerceroNombre = (terceroId: string) => {
    const tercero = terceros.find((t) => t.id === terceroId);
    return tercero ? `${tercero.apellido}, ${tercero.nombre}` : '-';
  };

  const filteredRelaciones = relaciones.filter((rel) => {
    const afiliadoNombre = getAfiliadoNombre(rel.afiliadoId).toLowerCase();
    const terceroNombre = getTerceroNombre(rel.tercerosVinculadoId).toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      afiliadoNombre.includes(search) ||
      terceroNombre.includes(search) ||
      rel.tipoRelacion.toLowerCase().includes(search)
    );
  });

  const afiliadoOptions = afiliados.map((afiliado) => ({
    value: afiliado.id,
    label: `${afiliado.apellido}, ${afiliado.nombre} - ${afiliado.dni}`
  }));

  const terceroOptions = terceros.map((tercero) => ({
    value: tercero.id,
    label: `${tercero.apellido}, ${tercero.nombre} - ${tercero.dni}`
  }));

  const tipoRelacionOptions = [
    { value: 'Padre/Madre', label: 'Padre/Madre' },
    { value: 'Hijo/Hija', label: 'Hijo/Hija' },
    { value: 'Cónyuge', label: 'Cónyuge' },
    { value: 'Hermano/Hermana', label: 'Hermano/Hermana' },
    { value: 'Tutor', label: 'Tutor' },
    { value: 'Curador', label: 'Curador' },
    { value: 'Otro', label: 'Otro' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Relaciones Afiliado-Tercero
          </h1>
          <p className="text-neutral-600 mt-2">Gestión de vínculos entre afiliados y terceros</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nueva Relación
        </button>
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por afiliado, tercero o tipo de relación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <LinkIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Afiliado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tercero Vinculado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tipo de Relación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Observaciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredRelaciones.map((relacion) => (
                  <tr key={relacion.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {getAfiliadoNombre(relacion.afiliadoId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {getTerceroNombre(relacion.tercerosVinculadoId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {relacion.tipoRelacion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                      {relacion.observaciones || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          relacion.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {relacion.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(relacion)}
                        className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(relacion.id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRelaciones.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No se encontraron relaciones</p>
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
                {editingRelacion ? 'Editar Relación' : 'Nueva Relación'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleEnterAsTab} autoComplete="off" className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Afiliado *</label>
                <SearchableSelect
                  options={[{ value: '', label: 'Seleccionar afiliado...' }, ...afiliadoOptions]}
                  value={formData.afiliadoId}
                  onChange={(value) => setFormData({ ...formData, afiliadoId: value })}
                  placeholder="Seleccionar afiliado..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tercero Vinculado *</label>
                <SearchableSelect
                  options={[{ value: '', label: 'Seleccionar tercero...' }, ...terceroOptions]}
                  value={formData.tercerosVinculadoId}
                  onChange={(value) => setFormData({ ...formData, tercerosVinculadoId: value })}
                  placeholder="Seleccionar tercero..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Relación *</label>
                <SearchableSelect
                  options={[{ value: '', label: 'Seleccionar tipo...' }, ...tipoRelacionOptions]}
                  value={formData.tipoRelacion}
                  onChange={(value) => setFormData({ ...formData, tipoRelacion: value })}
                  placeholder="Seleccionar tipo..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                  {saving ? 'Guardando...' : editingRelacion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
