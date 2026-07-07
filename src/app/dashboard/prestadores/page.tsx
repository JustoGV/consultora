'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveAdministradora, useActiveAdministradoraId } from '@/contexts/ActiveAdministradoraContext';
import { Prestador, Efector, CreatePrestadorDto } from '@/types';
import { prestadorService } from '@/services/prestadorService';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import api from '@/lib/axios';
import { handleEnterAsTab } from '@/lib/formUtils';
import { notify } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function PrestadoresPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const administradoraId = useActiveAdministradoraId();
  const { administradoras } = useActiveAdministradora();
  const confirm = useConfirm();
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [efectores, setEfectores] = useState<Efector[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreatePrestadorDto>({
    efectorId: '',
    administradoraId,
  });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prestadoresData, efectoresData] = await Promise.all([
        prestadorService.getAll(),
        api.get<Efector[]>('/efectores').then((r) => r.data).catch(() => []),
      ]);
      setPrestadores(prestadoresData);
      setEfectores(efectoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      notify.error('No se pudieron cargar los prestadores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      efectorId: '',
      administradoraId,
    });
    setFormError('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.efectorId) errors.efectorId = 'Requerido';
    if (!formData.administradoraId) errors.administradoraId = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      setSaving(true);
      await prestadorService.create(formData);
      await loadData();
      handleCloseModal();
    } catch (error: unknown) {
      console.error('Error al crear prestador:', error);
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        setFormError('Este efector ya está registrado como prestador en esta administradora');
      } else {
        setFormError('Error al crear prestador');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Dar de baja prestador',
      description: 'El prestador quedará inactivo. Podés reactivarlo luego.',
      confirmLabel: 'Dar de baja',
      destructive: true,
    });
    if (!ok) return;
    try {
      await prestadorService.delete(id);
      await loadData();
      notify.success('Prestador dado de baja');
    } catch (error) {
      console.error('Error al eliminar:', error);
      notify.error('No se pudo dar de baja el prestador');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await prestadorService.restore(id);
      await loadData();
      notify.success('Prestador reactivado');
    } catch (error) {
      console.error('Error al restaurar:', error);
      notify.error('No se pudo reactivar el prestador');
    }
  };

  const filteredPrestadores = prestadores.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.efector?.nombre?.toLowerCase().includes(search) ||
      p.efector?.cuit?.toLowerCase().includes(search) ||
      p.efector?.email?.toLowerCase().includes(search) ||
      p.administradora?.nombre?.toLowerCase().includes(search)
    );
  });

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedPrestadores,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({ items: filteredPrestadores, itemsPerPage: 10 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Prestadores
          </h1>
          <p className="text-neutral-600 mt-2">
            Gestión de efectores contratados por la administradora
          </p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Prestador
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CUIT, email o administradora..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Efector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    CUIT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Email
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Administradora
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Estado
                  </th>
                  {(isSuperAdmin || isAdmin) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedPrestadores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isSuperAdmin ? 7 : 6}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      No se encontraron prestadores
                    </td>
                  </tr>
                ) : (
                  paginatedPrestadores.map((prestador) => (
                    <tr key={prestador.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {prestador.efector?.tipo === 'PERSONA_JURIDICA' ? (
                            <BuildingOfficeIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-neutral-900">
                            {prestador.efector?.nombre ?? (
                              <span className="text-neutral-400 italic">Sin efector</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {prestador.efector?.tipo === 'PERSONA_JURIDICA'
                          ? 'Persona Jurídica'
                          : prestador.efector?.tipo === 'PERSONA_FISICA'
                          ? 'Persona Física'
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {prestador.efector?.cuit ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {prestador.efector?.email ?? '-'}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {prestador.administradora?.nombre ?? '-'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            prestador.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {prestador.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {(isSuperAdmin || isAdmin) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {prestador.activo ? (
                              <button
                                onClick={() => handleDelete(prestador.id)}
                                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Dar de baja"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRestore(prestador.id)}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">Nuevo Prestador</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleEnterAsTab} autoComplete="off" className="p-6 space-y-5">
              {/* Efector */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Efector <span className="text-red-500">*</span>
                </label>
                {efectores.length > 0 ? (
                  <select
                    value={formData.efectorId}
                    onChange={(e) => setFormData({ ...formData, efectorId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.efectorId ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    required
                  >
                    <option value="">Seleccionar efector...</option>
                    {efectores.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                        {e.cuit ? ` — ${e.cuit}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.efectorId}
                    onChange={(e) => setFormData({ ...formData, efectorId: e.target.value })}
                    placeholder="UUID del efector"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.efectorId ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                    required
                  />
                )}
                {fieldErrors.efectorId && <p className="text-xs text-red-600 mt-1">{fieldErrors.efectorId}</p>}
              </div>

              {/* Administradora (solo superadmin) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Administradora
                  </label>
                  <p className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                    {administradoras.find((a) => a.id === formData.administradoraId)?.nombre ||
                      formData.administradoraId ||
                      'Elegí una administradora activa en la barra superior'}
                  </p>
                  {fieldErrors.administradoraId && <p className="text-xs text-red-600 mt-1">{fieldErrors.administradoraId}</p>}
                </div>
              )}

              <p className="text-xs text-neutral-500">
                Un efector no puede estar registrado dos veces en la misma administradora.
              </p>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Error:</span> {formError}
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
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : null}
                  Crear prestador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
