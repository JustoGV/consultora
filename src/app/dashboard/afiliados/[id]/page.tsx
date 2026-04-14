'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { afiliadosService } from '@/services/afiliadosService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { personaTercerosService } from '@/services/personaTercerosService';
import { tercerosVinculadoService } from '@/services/tercerosVinculadoService';
import { alertasService } from '@/services/alertasService';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  IdentificationIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BellAlertIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type {
  Afiliado,
  CertificadoDiscapacidad,
  PersonaTercerosVinculado,
  Alerta,
  TercerosVinculado,
  CreatePersonaTercerosVinculadoDto,
  UpdatePersonaTercerosVinculadoDto,
  CreateTercerosVinculadoDto,
} from '@/types';

type NivelAlerta = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

const nivelAlertaColor: Record<NivelAlerta, string> = {
  BAJO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  CRITICO: 'bg-red-100 text-red-800',
};

const prioridadColor: Record<string, string> = {
  BAJA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-40 shrink-0 mb-0.5 sm:mb-0 sm:pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</span>
    </div>
  );
}

export default function AfiliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [relaciones, setRelaciones] = useState<PersonaTercerosVinculado[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [terceros, setTerceros] = useState<TercerosVinculado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal adherentes state
  const [isRelacionModalOpen, setIsRelacionModalOpen] = useState(false);
  const [editingRelacion, setEditingRelacion] = useState<PersonaTercerosVinculado | null>(null);
  const [modoAdherente, setModoAdherente] = useState<'existente' | 'nuevo'>('existente');
  const [relacionFormData, setRelacionFormData] = useState<CreatePersonaTercerosVinculadoDto>({
    tipoRelacion: '',
    observaciones: '',
    afiliadoId: id,
    tercerosVinculadoId: '',
    administradoraId: '',
    activo: true,
  });
  const [nuevoTerceroData, setNuevoTerceroData] = useState<Omit<CreateTercerosVinculadoDto, 'administradoraId' | 'activo' | 'edad'>>({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
  });
  const [savingRelacion, setSavingRelacion] = useState(false);
  const [relacionFormError, setRelacionFormError] = useState('');
  const [relacionFieldErrors, setRelacionFieldErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [afiliadoData, allCerts, allRelaciones, allAlertas, tercerosData] = await Promise.all([
        afiliadosService.getById(id),
        certificadosDiscapacidadService.getAll(),
        personaTercerosService.getAll(),
        alertasService.getAlertasByAfiliado(id).catch(() => [] as Alerta[]),
        tercerosVinculadoService.getAll(),
      ]);
      setAfiliado(afiliadoData);
      setCertificados(allCerts.filter((c) => c.afiliadoId === id));
      setRelaciones(allRelaciones.filter((r) => r.afiliadoId === id));
      setAlertas(allAlertas);
      setTerceros(tercerosData);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información del afiliado.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tipoRelacionOptions = [
    'Padre/Madre', 'Hijo/Hija', 'Cónyuge', 'Hermano/Hermana', 'Tutor', 'Curador', 'Otro',
  ];

  const calcularEdad = (fechaNacimiento: string): number => {
    const today = new Date();
    const birth = new Date(fechaNacimiento);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleOpenRelacionModal = (relacion?: PersonaTercerosVinculado) => {
    setRelacionFormError('');
    setRelacionFieldErrors({});
    if (relacion) {
      setEditingRelacion(relacion);
      setModoAdherente('existente');
      setRelacionFormData({
        tipoRelacion: relacion.tipoRelacion,
        observaciones: relacion.observaciones || '',
        afiliadoId: relacion.afiliadoId,
        tercerosVinculadoId: relacion.tercerosVinculadoId,
        administradoraId: relacion.administradoraId,
        activo: relacion.activo,
      });
    } else {
      setEditingRelacion(null);
      setModoAdherente('existente');
      setRelacionFormData({
        tipoRelacion: '',
        observaciones: '',
        afiliadoId: id,
        tercerosVinculadoId: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
      setNuevoTerceroData({ nombre: '', apellido: '', dni: '', fechaNacimiento: '', telefono: '', email: '' });
    }
    setIsRelacionModalOpen(true);
  };

  const handleCloseRelacionModal = () => {
    setIsRelacionModalOpen(false);
    setEditingRelacion(null);
    setRelacionFormError('');
    setRelacionFieldErrors({});
  };

  const handleSaveRelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relacionFormData.tipoRelacion) {
      setRelacionFieldErrors({ tipoRelacion: 'Requerido' });
      return;
    }
    setRelacionFieldErrors({});
    try {
      setSavingRelacion(true);
      if (editingRelacion) {
        const updateData: UpdatePersonaTercerosVinculadoDto = {
          tipoRelacion: relacionFormData.tipoRelacion,
          observaciones: relacionFormData.observaciones || undefined,
        };
        await personaTercerosService.update(editingRelacion.id, updateData);
      } else if (modoAdherente === 'nuevo') {
        const errorsNuevo: Record<string, string> = {};
        if (!nuevoTerceroData.nombre) errorsNuevo.nombre = 'Requerido';
        if (!nuevoTerceroData.apellido) errorsNuevo.apellido = 'Requerido';
        if (!nuevoTerceroData.dni) errorsNuevo.dni = 'Requerido';
        if (!nuevoTerceroData.fechaNacimiento) errorsNuevo.fechaNacimiento = 'Requerido';
        if (Object.keys(errorsNuevo).length > 0) {
          setRelacionFieldErrors(errorsNuevo);
          return;
        }
        const nuevoTercero = await tercerosVinculadoService.create({
          ...nuevoTerceroData,
          edad: calcularEdad(nuevoTerceroData.fechaNacimiento),
          administradoraId: user?.administradoraId || '',
          activo: true,
        });
        await personaTercerosService.create({ ...relacionFormData, tercerosVinculadoId: nuevoTercero.id });
      } else {
        if (!relacionFormData.tercerosVinculadoId) {
          setRelacionFieldErrors({ tercerosVinculadoId: 'Requerido' });
          return;
        }
        await personaTercerosService.create(relacionFormData);
      }
      await loadData();
      handleCloseRelacionModal();
    } catch (err) {
      console.error(err);
      setRelacionFormError(err instanceof Error ? err.message : 'Error al guardar el adherente');
    } finally {
      setSavingRelacion(false);
    }
  };

  const handleDeleteRelacion = async (relId: string) => {
    if (!confirm('¿Está seguro de eliminar este vínculo?')) return;
    try {
      await personaTercerosService.delete(relId);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el vínculo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !afiliado) {
    return (
      <div className="p-6">
        <Link href="/dashboard/afiliados" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Volver a Afiliados
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Afiliado no encontrado.'}
        </div>
      </div>
    );
  }

  const fullName = `${afiliado.apellido}, ${afiliado.nombre}`;
  const initials = `${afiliado.nombre.charAt(0)}${afiliado.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/afiliados" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
        <ArrowLeftIcon className="w-4 h-4" /> Volver a Afiliados
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col sm:flex-row items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-blue-700">{initials}</span>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${afiliado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
              {afiliado.activo ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
              {afiliado.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            N° Afiliado: <span className="font-semibold text-gray-700">{afiliado.numeroAfiliado}</span>
            {' · '}
            Plan: <span className="font-semibold text-gray-700">{afiliado.plan}</span>
            {' · '}
            DNI: <span className="font-semibold text-gray-700">{afiliado.dni}</span>
          </p>
        </div>
      </div>

      {/* Datos grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Datos Personales */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <UserCircleIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Datos Personales</h2>
          </div>
          <InfoRow label="Nombre" value={afiliado.nombre} />
          <InfoRow label="Apellido" value={afiliado.apellido} />
          <InfoRow label="DNI" value={afiliado.dni} />
          <InfoRow label="Fecha de Nacimiento" value={afiliado.fechaNacimiento ? new Date(afiliado.fechaNacimiento).toLocaleDateString('es-AR') : undefined} />
          <InfoRow label="Edad" value={afiliado.edad != null ? `${afiliado.edad} años` : undefined} />
          <InfoRow label="Sexo" value={afiliado.sexo} />
          <InfoRow label="Estado Civil" value={afiliado.estadoCivil?.nombre} />
        </div>

        {/* Afiliación */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <IdentificationIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Afiliación</h2>
          </div>
          <InfoRow label="N° Afiliado" value={afiliado.numeroAfiliado} />
          <InfoRow label="Plan" value={afiliado.plan} />
          <InfoRow label="Administradora" value={afiliado.administradora?.nombre} />
          <InfoRow label="Estado" value={afiliado.activo ? 'Activo' : 'Inactivo'} />
          <InfoRow label="Alta" value={afiliado.createdAt ? new Date(afiliado.createdAt).toLocaleDateString('es-AR') : undefined} />
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <PhoneIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Contacto</h2>
          </div>
          <InfoRow label="Email" value={afiliado.email} />
          <InfoRow label="Teléfono" value={afiliado.telefono} />
          <InfoRow label="Celular" value={afiliado.celular} />
        </div>

        {/* Domicilio */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <MapPinIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Domicilio</h2>
          </div>
          <InfoRow label="Dirección" value={afiliado.direccion} />
          <InfoRow label="Localidad" value={afiliado.localidad} />
          <InfoRow label="Provincia" value={afiliado.provincia} />
          <InfoRow label="Código Postal" value={afiliado.codigoPostal} />
        </div>
      </div>

      {/* Adherentes / Terceros Vinculados */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-purple-700">
          <UserGroupIcon className="w-5 h-5" />
          <h2 className="font-semibold text-sm uppercase tracking-wide">Adherentes / Terceros Vinculados</h2>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">{relaciones.length}</span>
          <button
            onClick={() => handleOpenRelacionModal()}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
        {relaciones.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay terceros vinculados registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left py-2 pr-4">Nombre</th>
                  <th className="text-left py-2 pr-4">DNI</th>
                  <th className="text-left py-2 pr-4">Relación</th>
                  <th className="text-left py-2 pr-4">Edad</th>
                  <th className="text-left py-2 pr-4">Observaciones</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {relaciones.map((rel) => (
                  <tr key={rel.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-800">
                      {rel.tercerosVinculado
                        ? `${rel.tercerosVinculado.apellido}, ${rel.tercerosVinculado.nombre}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{rel.tercerosVinculado?.dni || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {rel.tipoRelacion}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {rel.tercerosVinculado?.edad != null ? `${rel.tercerosVinculado.edad} años` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{rel.observaciones || '—'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenRelacionModal(rel)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRelacion(rel.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar vínculo"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificados de Discapacidad */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-teal-700">
          <DocumentTextIcon className="w-5 h-5" />
          <h2 className="font-semibold text-sm uppercase tracking-wide">Certificados de Discapacidad</h2>
          <span className="ml-auto text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">{certificados.length}</span>
        </div>
        {certificados.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay certificados registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left py-2 pr-4">N° Certificado</th>
                  <th className="text-left py-2 pr-4">Grado</th>
                  <th className="text-left py-2 pr-4">Nivel Alerta</th>
                  <th className="text-left py-2 pr-4">Emisión</th>
                  <th className="text-left py-2 pr-4">Vencimiento</th>
                  <th className="text-left py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-800">{cert.numeroCertificado}</td>
                    <td className="py-2 pr-4 text-gray-600">{cert.grado}</td>
                    <td className="py-2 pr-4">
                      {cert.nivelAlerta ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${nivelAlertaColor[cert.nivelAlerta as NivelAlerta] || 'bg-gray-100 text-gray-700'}`}>
                          {cert.nivelAlerta}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {cert.fechaEmision ? new Date(cert.fechaEmision).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {cert.fechaVencimiento ? new Date(cert.fechaVencimiento).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cert.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {cert.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Alertas */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-amber-700">
          <BellAlertIcon className="w-5 h-5" />
          <h2 className="font-semibold text-sm uppercase tracking-wide">Historial de Alertas</h2>
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{alertas.length}</span>
        </div>
        {alertas.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay alertas registradas para este afiliado.</p>
        ) : (
          <div className="space-y-2">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="mt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${prioridadColor[alerta.prioridad] || 'bg-gray-100 text-gray-700'}`}>
                    {alerta.prioridad}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{alerta.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alerta.mensaje}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(alerta.createdAt).toLocaleDateString('es-AR')}
                  </p>
                  <span className={`text-xs font-medium mt-1 inline-block ${alerta.estado === 'RESUELTA' ? 'text-green-600' : alerta.estado === 'PENDIENTE' ? 'text-amber-600' : 'text-gray-500'}`}>
                    {alerta.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adherente */}
      {isRelacionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingRelacion ? 'Editar Adherente' : 'Agregar Adherente'}
              </h2>
              <button onClick={handleCloseRelacionModal} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRelacion} className="p-5 space-y-4">
              {/* Toggle existente/nuevo — solo al crear */}
              {!editingRelacion && (
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button
                    type="button"
                    onClick={() => setModoAdherente('existente')}
                    className={`flex-1 py-2 font-medium transition-colors ${
                      modoAdherente === 'existente' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Seleccionar existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoAdherente('nuevo')}
                    className={`flex-1 py-2 font-medium transition-colors ${
                      modoAdherente === 'nuevo' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Crear nuevo
                  </button>
                </div>
              )}

              {/* Seleccionar existente */}
              {(editingRelacion || modoAdherente === 'existente') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tercero vinculado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={relacionFormData.tercerosVinculadoId}
                    onChange={(e) => setRelacionFormData((prev) => ({ ...prev, tercerosVinculadoId: e.target.value }))}
                    disabled={!!editingRelacion}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Seleccionar...</option>
                    {terceros.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.apellido}, {t.nombre} — DNI {t.dni}
                      </option>
                    ))}
                  </select>
                  {!editingRelacion && terceros.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No hay terceros vinculados. Us&aacute; &ldquo;Crear nuevo&rdquo; para agregar uno.</p>
                  )}
                </div>
              )}

              {/* Crear nuevo */}
              {!editingRelacion && modoAdherente === 'nuevo' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del nuevo adherente</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Apellido <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={nuevoTerceroData.apellido}
                        onChange={(e) => setNuevoTerceroData((prev) => ({ ...prev, apellido: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Apellido"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={nuevoTerceroData.nombre}
                        onChange={(e) => setNuevoTerceroData((prev) => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">DNI <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={nuevoTerceroData.dni}
                        onChange={(e) => setNuevoTerceroData((prev) => ({ ...prev, dni: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="DNI"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de nacimiento <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={nuevoTerceroData.fechaNacimiento}
                        onChange={(e) => setNuevoTerceroData((prev) => ({ ...prev, fechaNacimiento: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={nuevoTerceroData.telefono || ''}
                        onChange={(e) => setNuevoTerceroData((prev) => ({ ...prev, telefono: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={nuevoTerceroData.email || ''}
                        onChange={(e) => setNuevoTerceroData((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de relación <span className="text-red-500">*</span>
                </label>
                <select
                  value={relacionFormData.tipoRelacion}
                  onChange={(e) => setRelacionFormData((prev) => ({ ...prev, tipoRelacion: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {tipoRelacionOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={relacionFormData.observaciones || ''}
                  onChange={(e) => setRelacionFormData((prev) => ({ ...prev, observaciones: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Observaciones opcionales..."
                />
              </div>
              {relacionFormError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Error:</span> {relacionFormError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRelacionModal}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRelacion}
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {savingRelacion ? 'Guardando...' : editingRelacion ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
