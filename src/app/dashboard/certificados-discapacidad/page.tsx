'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CertificadoDiscapacidad,
  CreateCertificadoDiscapacidadDto,
  Afiliado,
  TipoDiscapacidad,
  OrientacionPrestacional,
  Diagnostico,
  Alerta,
  NivelAlertaCertificado
} from '@/types';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { afiliadosService } from '@/services/afiliadosService';
import { tipoDiscapacidadService } from '@/services/tipoDiscapacidadService';
import { orientacionPrestacionalService } from '@/services/orientacionPrestacionalService';
import { diagnosticoService } from '@/services/diagnosticoService';
import { alertasService } from '@/services/alertasService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, DocumentTextIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

export default function CertificadosDiscapacidadPage() {
  const { user } = useAuth();
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [tiposDiscapacidad, setTiposDiscapacidad] = useState<TipoDiscapacidad[]>([]);
  const [orientaciones, setOrientaciones] = useState<OrientacionPrestacional[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificado, setEditingCertificado] = useState<CertificadoDiscapacidad | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrientacionId, setSelectedOrientacionId] = useState('');
  const [tipoToAdd, setTipoToAdd] = useState('');
  const [certificadoAlertas, setCertificadoAlertas] = useState<Alerta[]>([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);

  const [formData, setFormData] = useState<CreateCertificadoDiscapacidadDto>({
    numeroCertificado: '',
    fechaEmision: '',
    fechaVencimiento: '',
    grado: '',
    afiliadoId: '',
    tipoDiscapacidadId: '',
    tipoDiscapacidadIds: [],
    diagnosticoId: '',
    nivelAlerta: undefined,
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
      const [certificadosData, afiliadosData, tiposData, orientacionesData, diagnosticosData] = await Promise.all([
        certificadosDiscapacidadService.getAll(),
        afiliadosService.getAll(),
        tipoDiscapacidadService.getAll(),
        orientacionPrestacionalService.getAll(),
        diagnosticoService.getAll(),
      ]);
      setCertificados(certificadosData);
      setAfiliados(afiliadosData);
      setTiposDiscapacidad(tiposData);
      setOrientaciones(orientacionesData);
      setDiagnosticos(diagnosticosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (certificado?: CertificadoDiscapacidad) => {
    if (certificado) {
      setEditingCertificado(certificado);
      const tiposIds = certificado.tipoDiscapacidadIds?.length
        ? certificado.tipoDiscapacidadIds
        : certificado.tipoDiscapacidadId ? [certificado.tipoDiscapacidadId] : [];
      setFormData({
        numeroCertificado: certificado.numeroCertificado,
        fechaEmision: certificado.fechaEmision.split('T')[0],
        fechaVencimiento: certificado.fechaVencimiento ? certificado.fechaVencimiento.split('T')[0] : '',
        grado: certificado.grado,
        afiliadoId: certificado.afiliadoId,
        tipoDiscapacidadId: certificado.tipoDiscapacidadId,
        tipoDiscapacidadIds: tiposIds,
        diagnosticoId: certificado.diagnosticoId || '',
        nivelAlerta: certificado.nivelAlerta,
        administradoraId: certificado.administradoraId,
        activo: certificado.activo,
      });
      setSelectedOrientacionId('');
      setTipoToAdd('');
      // Load alerts linked to this certificate
      setLoadingAlertas(true);
      alertasService.getAlertasByAfiliado(certificado.afiliadoId)
        .then(alertas => {
          setCertificadoAlertas(
            alertas.filter(
              a => a.entidadOrigen === 'certificados_discapacidad' && a.entidadOrigenId === certificado.id
            )
          );
        })
        .catch(() => setCertificadoAlertas([]))
        .finally(() => setLoadingAlertas(false));
    } else {
      setEditingCertificado(null);
      setFormData({
        numeroCertificado: '',
        fechaEmision: '',
        fechaVencimiento: '',
        grado: '',
        afiliadoId: '',
        tipoDiscapacidadId: '',
        tipoDiscapacidadIds: [],
        diagnosticoId: '',
        nivelAlerta: undefined,
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
      setSelectedOrientacionId('');
      setTipoToAdd('');
      setCertificadoAlertas([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCertificado(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numeroCertificado || !formData.fechaEmision || !formData.grado || !formData.afiliadoId || (formData.tipoDiscapacidadIds?.length ?? 0) === 0) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    if (!formData.administradoraId) {
      alert('No se pudo determinar la administradora del usuario');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        tipoDiscapacidadId: formData.tipoDiscapacidadIds?.[0] || formData.tipoDiscapacidadId,
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
      alert(error instanceof Error ? error.message : 'Error al guardar certificado');
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
      alert(error instanceof Error ? error.message : 'Error al eliminar certificado');
    }
  };

  const getAfiliadoNombre = (afiliadoId: string) => {
    const afiliado = afiliados.find((a) => a.id === afiliadoId);
    return afiliado ? `${afiliado.apellido}, ${afiliado.nombre}` : '-';
  };

  const getTipoDiscapacidadNombre = (tipoId: string) => {
    const tipo = tiposDiscapacidad.find((t) => t.id === tipoId);
    return tipo ? tipo.nombre : '-';
  };

  const getCertificadoTiposLabel = (cert: CertificadoDiscapacidad) => {
    const ids = cert.tipoDiscapacidadIds?.length
      ? cert.tipoDiscapacidadIds
      : cert.tipoDiscapacidadId ? [cert.tipoDiscapacidadId] : [];
    if (ids.length === 0) return '-';
    const nombres = ids.map(id => getTipoDiscapacidadNombre(id));
    if (nombres.length === 1) return nombres[0];
    return `${nombres[0]} (+${nombres.length - 1})`;
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
    label: `${af.apellido}, ${af.nombre} (DNI: ${af.dni}) - N° ${af.numeroAfiliado}`
  }));

  const diagnosticoOptions = diagnosticos.map(d => ({
    value: d.id,
    label: `${d.codigo} - ${d.nombre}`
  }));

  const tipoDiscapacidadOptions = tiposDiscapacidad.map(tipo => ({
    value: tipo.id,
    label: tipo.nombre
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {getCertificadoTiposLabel(certificado)}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Afiliado *</label>
                  <SearchableSelect
                    options={afiliadoOptions}
                    value={formData.afiliadoId}
                    onChange={(value) => setFormData({ ...formData, afiliadoId: value })}
                    placeholder="Buscar por nombre, DNI o N° de afiliado..."
                    required
                  />
                </div>

                {/* Tipos de Discapacidad — multi-select */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipos de Discapacidad *</label>
                  {formData.tipoDiscapacidadIds && formData.tipoDiscapacidadIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tipoDiscapacidadIds.map(id => {
                        const tipo = tiposDiscapacidad.find(t => t.id === id);
                        return tipo ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                            {tipo.nombre}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, tipoDiscapacidadIds: (prev.tipoDiscapacidadIds ?? []).filter(t => t !== id) }))}
                              className="ml-1 text-primary-500 hover:text-primary-700"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <SearchableSelect
                      options={tiposDiscapacidad
                        .filter(t => !(formData.tipoDiscapacidadIds ?? []).includes(t.id))
                        .map(t => ({ value: t.id, label: t.nombre }))}
                      value={tipoToAdd}
                      onChange={(val) => {
                        if (val) {
                          setFormData(prev => ({ ...prev, tipoDiscapacidadIds: [...(prev.tipoDiscapacidadIds ?? []), val] }));
                          setTipoToAdd('');
                        }
                      }}
                      placeholder="Agregar tipo de discapacidad..."
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipoDiscapacidadIds: tiposDiscapacidad.map(t => t.id) }))}
                      className="px-3 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-600 whitespace-nowrap border border-neutral-300"
                    >
                      Todos
                    </button>
                  </div>
                  {(!formData.tipoDiscapacidadIds || formData.tipoDiscapacidadIds.length === 0) && (
                    <p className="text-xs text-red-500 mt-1">Seleccione al menos un tipo de discapacidad</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Diagnóstico</label>
                  <SearchableSelect
                    options={diagnosticoOptions}
                    value={formData.diagnosticoId || ''}
                    onChange={(value) => setFormData({ ...formData, diagnosticoId: value })}
                    placeholder="Seleccionar diagnóstico..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nivel de Alerta</label>
                  <select
                    value={formData.nivelAlerta || ''}
                    onChange={(e) => setFormData({ ...formData, nivelAlerta: (e.target.value as NivelAlertaCertificado) || undefined })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">Sin nivel de alerta</option>
                    <option value="BAJO">Bajo</option>
                    <option value="MEDIO">Medio</option>
                    <option value="ALTO">Alto</option>
                    <option value="CRITICO">Crítico</option>
                  </select>
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

                {/* Historial de alertas — solo visible al editar */}
                {editingCertificado && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                      <BellAlertIcon className="w-4 h-4 text-primary-600" />
                      Historial de Alertas
                    </h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                      {/* Evento hardcodeado: creación del certificado */}
                      <div className="flex gap-3 text-xs">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium text-neutral-700">Se creó el certificado</span>
                          <span className="text-neutral-400 ml-2">
                            {new Date(editingCertificado.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      {/* Alertas del backend filtradas por este certificado */}
                      {loadingAlertas ? (
                        <div className="text-center py-2 text-xs text-neutral-400">Cargando alertas...</div>
                      ) : certificadoAlertas.length === 0 ? (
                        <div className="text-xs text-neutral-400 py-1 pl-5">Sin alertas adicionales registradas</div>
                      ) : (
                        certificadoAlertas.map(alerta => (
                          <div key={alerta.id} className="flex gap-3 text-xs">
                            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                              alerta.prioridad === 'CRITICA' ? 'bg-red-500' :
                              alerta.prioridad === 'ALTA' ? 'bg-orange-500' :
                              alerta.prioridad === 'MEDIA' ? 'bg-yellow-500' :
                              'bg-blue-400'
                            }`}></div>
                            <div>
                              <span className="font-medium text-neutral-700">{alerta.titulo}</span>
                              {alerta.mensaje && <p className="text-neutral-500 mt-0.5">{alerta.mensaje}</p>}
                              <span className="text-neutral-400">
                                {new Date(alerta.createdAt).toLocaleDateString('es-AR', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
