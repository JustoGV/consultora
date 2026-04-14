'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CertificadoDiscapacidad,
  CreateCertificadoDiscapacidadDto,
  Afiliado,
  TipoDiscapacidad,
  OrientacionPrestacional
} from '@/types';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { afiliadosService } from '@/services/afiliadosService';
import { tipoDiscapacidadService } from '@/services/tipoDiscapacidadService';
import { orientacionPrestacionalService } from '@/services/orientacionPrestacionalService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractErrorMessage } from '@/lib/errorUtils';

export default function CertificadosDiscapacidadPage() {
  const { user } = useAuth();
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [tiposDiscapacidad, setTiposDiscapacidad] = useState<TipoDiscapacidad[]>([]);
  const [orientaciones, setOrientaciones] = useState<OrientacionPrestacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificado, setEditingCertificado] = useState<CertificadoDiscapacidad | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrientacionId, setSelectedOrientacionId] = useState('');
  const [selectedTiposIds, setSelectedTiposIds] = useState<string[]>([]);
  const [tipoSearchTerm, setTipoSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Omit<CreateCertificadoDiscapacidadDto, 'tipoDiscapacidadId' | 'tipoDiscapacidadIds'> & { tipoDiscapacidadId: string }>( {
    numeroCertificado: '',
    fechaEmision: '',
    fechaVencimiento: '',
    grado: '',
    observaciones: '',
    afiliadoId: '',
    tipoDiscapacidadId: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.administradoraId) {
      setFormData((prev) => ({ ...prev, administradoraId: user.administradoraId || '' }));
    }
  }, [user?.administradoraId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certificadosData, afiliadosData, tiposData, orientacionesData] = await Promise.all([
        certificadosDiscapacidadService.getAll(),
        afiliadosService.getAll(),
        tipoDiscapacidadService.getAll(),
        orientacionPrestacionalService.getAll(),
      ]);
      setCertificados(certificadosData);
      setAfiliados(afiliadosData);
      setTiposDiscapacidad(tiposData);
      setOrientaciones(orientacionesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (certificado?: CertificadoDiscapacidad) => {
    setFormError('');
    setFieldErrors({});
    if (certificado) {
      setEditingCertificado(certificado);
      const tiposIds = certificado.tipoDiscapacidadIds && certificado.tipoDiscapacidadIds.length > 0
        ? certificado.tipoDiscapacidadIds
        : certificado.tipoDiscapacidadId ? [certificado.tipoDiscapacidadId] : [];
      setSelectedTiposIds(tiposIds);
      setFormData({
        numeroCertificado: certificado.numeroCertificado,
        fechaEmision: certificado.fechaEmision.split('T')[0],
        fechaVencimiento: certificado.fechaVencimiento ? certificado.fechaVencimiento.split('T')[0] : '',
        grado: certificado.grado,
        observaciones: certificado.observaciones || '',
        afiliadoId: certificado.afiliadoId,
        tipoDiscapacidadId: tiposIds[0] || '',
        administradoraId: certificado.administradoraId,
        activo: certificado.activo,
      });
      setSelectedOrientacionId('');
      setTipoSearchTerm('');
      setEditingCertificado(null);
      setSelectedTiposIds([]);
      setTipoSearchTerm('');
      setFormData({
        numeroCertificado: '',
        fechaEmision: '',
        fechaVencimiento: '',
        grado: '',
        observaciones: '',
        afiliadoId: '',
        tipoDiscapacidadId: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
      setSelectedOrientacionId('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCertificado(null);
    setFormError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.numeroCertificado) errors.numeroCertificado = 'Requerido';
    if (!formData.fechaEmision) errors.fechaEmision = 'Requerido';
    if (!formData.grado) errors.grado = 'Requerido';
    if (!formData.afiliadoId) errors.afiliadoId = 'Requerido';
    if (selectedTiposIds.length === 0) errors.tipoDiscapacidadId = 'Seleccione al menos un tipo';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (!formData.administradoraId) {
      setFormError('No se pudo determinar la administradora del usuario');
      return;
    }

    try {
      setSaving(true);

      const payload: CreateCertificadoDiscapacidadDto = {
        ...formData,
        tipoDiscapacidadId: selectedTiposIds[0],
        tipoDiscapacidadIds: selectedTiposIds,
        administradoraId: formData.administradoraId || user?.administradoraId || ''
      };

      if (editingCertificado) {
        await certificadosDiscapacidadService.update(editingCertificado.id, payload);
      } else {
        const created = await certificadosDiscapacidadService.create(payload);
        if (selectedOrientacionId) {
          await orientacionPrestacionalService.addCertificado(selectedOrientacionId, {
            certificadoDiscapacidadId: created.id
          });
        }
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este certificado?')) return;

    try {
      await certificadosDiscapacidadService.delete(id);
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

  const getTipoDiscapacidadNombre = (tipoId: string, tipoIds?: string[]) => {
    const ids = tipoIds && tipoIds.length > 0 ? tipoIds : [tipoId];
    const nombres = ids.map(id => tiposDiscapacidad.find(t => t.id === id)?.nombre).filter(Boolean);
    return nombres.length > 0 ? nombres.join(', ') : '-';
  };

  const toggleTipoDiscapacidad = (id: string) => {
    setSelectedTiposIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredCertificados = certificados.filter((cert) => {
    const afiliadoNombre = getAfiliadoNombre(cert.afiliadoId).toLowerCase();
    const tipoNombre = getTipoDiscapacidadNombre(cert.tipoDiscapacidadId).toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      cert.numeroCertificado.toLowerCase().includes(search) ||
      afiliadoNombre.includes(search) ||
      tipoNombre.includes(search) ||
      cert.grado.toLowerCase().includes(search)
    );
  });

  // Paginación
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedCertificados,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredCertificados, itemsPerPage: 10 });

  // Opciones para selects
  const afiliadoOptions = afiliados.map(af => ({
    value: af.id,
    label: `${af.apellido}, ${af.nombre} (DNI: ${af.dni})`
  }));

  const orientacionOptions = orientaciones.map((orientacion) => ({
    value: orientacion.id,
    label: orientacion.titulo
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Certificados de Discapacidad
          </h1>
          <p className="text-neutral-600 mt-2">Gestión de certificados de discapacidad</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Certificado
        </button>
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por número, afiliado, tipo o grado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <DocumentTextIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">N° Certificado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Afiliado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tipo Discapacidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Grado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Fecha Emisión</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedCertificados.map((certificado) => (
                  <tr key={certificado.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {certificado.numeroCertificado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {getAfiliadoNombre(certificado.afiliadoId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {getTipoDiscapacidadNombre(certificado.tipoDiscapacidadId, certificado.tipoDiscapacidadIds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{certificado.grado}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {new Date(certificado.fechaEmision).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {certificado.fechaVencimiento
                        ? new Date(certificado.fechaVencimiento).toLocaleDateString('es-AR')
                        : 'Sin vencimiento'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          certificado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {certificado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(certificado)}
                        className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(certificado.id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedCertificados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No se encontraron certificados</p>
              </div>
            )}
          </div>
        )}

        {/* Paginación */}
        {!loading && filteredCertificados.length > 0 && (
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
                {editingCertificado ? 'Editar Certificado' : 'Nuevo Certificado'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Número de Certificado *</label>
                  <input
                    type="text"
                    value={formData.numeroCertificado}
                    onChange={(e) => setFormData({ ...formData, numeroCertificado: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Afiliado *</label>
                  <SearchableSelect
                    options={afiliadoOptions}
                    value={formData.afiliadoId}
                    onChange={(value) => setFormData({ ...formData, afiliadoId: value })}
                    placeholder="Seleccionar afiliado..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-neutral-700">Tipos de Discapacidad *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTiposIds(tiposDiscapacidad.map(t => t.id))}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Seleccionar todos
                      </button>
                      {selectedTiposIds.length > 0 && (
                        <>
                          <span className="text-neutral-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedTiposIds([])}
                            className="text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                          >
                            Limpiar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`border rounded-lg ${
                    fieldErrors.tipoDiscapacidadId ? 'border-red-400' : 'border-neutral-300'
                  }`}>
                    <div className="px-2 pt-2">
                      <input
                        type="text"
                        value={tipoSearchTerm}
                        onChange={(e) => setTipoSearchTerm(e.target.value)}
                        placeholder="Buscar tipo de discapacidad..."
                        className="w-full text-sm border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                    </div>
                    <div className={`max-h-40 overflow-y-auto p-2 space-y-1 ${
                      fieldErrors.tipoDiscapacidadId ? 'bg-red-50' : ''
                    }`}>
                      {tiposDiscapacidad.filter(t =>
                        t.nombre.toLowerCase().includes(tipoSearchTerm.toLowerCase())
                      ).map(tipo => (
                        <label key={tipo.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTiposIds.includes(tipo.id)}
                            onChange={() => toggleTipoDiscapacidad(tipo.id)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-700">{tipo.nombre}</span>
                        </label>
                      ))}
                      {tiposDiscapacidad.filter(t =>
                        t.nombre.toLowerCase().includes(tipoSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-neutral-400 text-center py-2">
                          {tipoSearchTerm ? 'Sin resultados' : 'No hay tipos disponibles'}
                        </p>
                      )}
                    </div>
                  </div>
                  {fieldErrors.tipoDiscapacidadId && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.tipoDiscapacidadId}</p>
                  )}
                  {selectedTiposIds.length > 0 && (
                    <p className="text-xs text-neutral-500 mt-1">{selectedTiposIds.length} seleccionado{selectedTiposIds.length > 1 ? 's' : ''}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Orientación Prestacional</label>
                  <SearchableSelect
                    options={orientacionOptions}
                    value={selectedOrientacionId}
                    onChange={setSelectedOrientacionId}
                    placeholder="Seleccionar orientación..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Grado *</label>
                  <input
                    type="text"
                    value={formData.grado}
                    onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: Leve, Moderado, Severo"
                    required
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Emisión *</label>
                  <input
                    type="date"
                    value={formData.fechaEmision}
                    onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={500}
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
                  {saving ? 'Guardando...' : editingCertificado ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
