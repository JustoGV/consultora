'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Afiliado, CreateAfiliadoDto, CreateAderenteDto, Aderente, EstadoCivil, TercerosVinculado, PersonaTercerosVinculado, CreateTercerosVinculadoDto, CreatePersonaTercerosVinculadoDto } from '@/types';
import { afiliadosService } from '@/services/afiliadosService';
import { estadoCivilService } from '@/services/estadoCivilService';
import { tercerosVinculadoService } from '@/services/tercerosVinculadoService';
import { personaTercerosService } from '@/services/personaTercerosService';
import { aderentesService } from '@/services/aderentesService';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import Link from 'next/link';
import { extractErrorMessage } from '@/lib/errorUtils';

export default function AfiliadosPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAfiliado, setEditingAfiliado] = useState<Afiliado | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [adherenteError, setAdherenteError] = useState('');

  // Terceros Vinculados en el formulario
  type PendingItem = {
    id: string; tipoRelacion: string; observaciones?: string;
    modo: 'existente' | 'nuevo'; tercerosVinculadoId?: string; terceroNombre: string;
    nuevoDatos?: { nombre: string; apellido: string; dni: string; fechaNacimiento: string; telefono?: string; email?: string };
  };
  type PendingAderente = {
    id: string; nombre: string; apellido: string; caracterAfiliado: string;
    telefono?: string; direccion?: string; email?: string; codigoPostal?: string;
  };
  const [terceros, setTerceros] = useState<TercerosVinculado[]>([]);

  // Adherentes
  const [pendingAdherentes, setPendingAdherentes] = useState<PendingAderente[]>([]);
  const [modoAdherente, setModoAdherente] = useState<'existente' | 'nuevo'>('existente');
  const [aderentes, setAderentes] = useState<Aderente[]>([]);
  const [selectedAderenteId, setSelectedAderenteId] = useState('');
  const [nuevaAderenteData, setNuevaAderenteData] = useState({ nombre: '', apellido: '', telefono: '', direccion: '', email: '', codigoPostal: '' });
  const [relacionAderenteData, setRelacionAderenteData] = useState({ caracterAfiliado: '', observaciones: '' });

  // Terceros Vinculados
  const [pendingTerceros, setPendingTerceros] = useState<PendingItem[]>([]);
  const [modoTercero, setModoTercero] = useState<'existente' | 'nuevo'>('existente');
  const [relTerceroFormData, setRelTerceroFormData] = useState({ tipoRelacion: '', observaciones: '', tercerosVinculadoId: '' });
  const [nuevoTerceroVinculadoData, setNuevoTerceroVinculadoData] = useState({ nombre: '', apellido: '', dni: '', fechaNacimiento: '', telefono: '', email: '' });
  const [terceroVinculadoError, setTerceroVinculadoError] = useState('');

  const [formData, setFormData] = useState<CreateAfiliadoDto>({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    edad: 0,
    sexo: 'M',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    numeroAfiliado: '',
    plan: '',
    estadoCivilId: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.administradoraId) {
      setFormData(prev => ({ ...prev, administradoraId: user.administradoraId || '' }));
    }
  }, [user?.administradoraId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [afiliadosData, estadosCivilesData, tercerosData, aderentesData] = await Promise.all([
        afiliadosService.getAll(),
        estadoCivilService.getAll(),
        tercerosVinculadoService.getAll(),
        aderentesService.getAll(),
      ]);
      setAfiliados(afiliadosData);
      setEstadosCiviles(estadosCivilesData);
      setTerceros(tercerosData);
      setAderentes(aderentesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleOpenModal = (afiliado?: Afiliado) => {
    setFormError('');
    setFieldErrors({});
    setAdherenteError('');
    if (afiliado) {
      setEditingAfiliado(afiliado);
      setFormData({
        nombre: afiliado.nombre,
        apellido: afiliado.apellido,
        dni: afiliado.dni,
        fechaNacimiento: afiliado.fechaNacimiento.split('T')[0],
        edad: afiliado.edad,
        sexo: afiliado.sexo,
        email: afiliado.email || '',
        telefono: afiliado.telefono || '',
        celular: afiliado.celular || '',
        direccion: afiliado.direccion,
        localidad: afiliado.localidad,
        provincia: afiliado.provincia,
        codigoPostal: afiliado.codigoPostal,
        numeroAfiliado: afiliado.numeroAfiliado,
        plan: afiliado.plan,
        estadoCivilId: afiliado.estadoCivilId || '',
        administradoraId: afiliado.administradoraId,
        activo: afiliado.activo,
      });
    } else {
      setEditingAfiliado(null);
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        fechaNacimiento: '',
        edad: 0,
        sexo: 'M',
        email: '',
        telefono: '',
        celular: '',
        direccion: '',
        localidad: '',
        provincia: '',
        codigoPostal: '',
        numeroAfiliado: '',
        plan: '',
        estadoCivilId: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
      setPendingAdherentes([]);
      setModoAdherente('existente');
      setSelectedAderenteId('');
      setNuevaAderenteData({ nombre: '', apellido: '', telefono: '', direccion: '', email: '', codigoPostal: '' });
      setRelacionAderenteData({ caracterAfiliado: '', observaciones: '' });
      setPendingTerceros([]);
      setRelTerceroFormData({ tipoRelacion: '', observaciones: '', tercerosVinculadoId: '' });
      setNuevoTerceroVinculadoData({ nombre: '', apellido: '', dni: '', fechaNacimiento: '', telefono: '', email: '' });
      setModoTercero('existente');
      setTerceroVinculadoError('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAfiliado(null);
    setPendingAdherentes([]);
    setPendingTerceros([]);
    setFormError('');
    setFieldErrors({});
    setAdherenteError('');
    setTerceroVinculadoError('');
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
        edad: calculateAge(formData.fechaNacimiento),
        administradoraId: formData.administradoraId || user?.administradoraId || '',
      };
      if (editingAfiliado) {
        await afiliadosService.update(editingAfiliado.id, dataToSend);
      } else {
        const created = await afiliadosService.create(dataToSend);
        try {
          // Adherentes via /aderentes
          for (const pa of pendingAdherentes) {
            const adDto: CreateAderenteDto = {
              nombre: pa.nombre,
              apellido: pa.apellido,
              caracterAfiliado: pa.caracterAfiliado,
              afiliadoId: created.id,
              administradoraId: user?.administradoraId || '',
              telefono: pa.telefono || undefined,
              direccion: pa.direccion || undefined,
              email: pa.email || undefined,
              codigoPostal: pa.codigoPostal || undefined,
              activo: true,
            };
            await aderentesService.create(adDto);
          }
          // Terceros Vinculados via /terceros-vinculado + /persona-terceros-vinculado
          for (const pt of pendingTerceros) {
            let tvId = pt.tercerosVinculadoId!;
            if (pt.modo === 'nuevo' && pt.nuevoDatos) {
              const nuevo = await tercerosVinculadoService.create({
                ...pt.nuevoDatos,
                edad: calculateAge(pt.nuevoDatos.fechaNacimiento),
                administradoraId: user?.administradoraId || '',
                activo: true,
              });
              tvId = nuevo.id;
            }
            await personaTercerosService.create({
              afiliadoId: created.id,
              tercerosVinculadoId: tvId,
              tipoRelacion: pt.tipoRelacion,
              observaciones: pt.observaciones || undefined,
              administradoraId: user?.administradoraId || '',
              activo: true,
            });
          }
        } catch (relError) {
          // Rollback: eliminar el afiliado recién creado para no dejarlo huérfano
          try { await afiliadosService.delete(created.id); } catch { /* ignorar error de rollback */ }
          const msg = extractErrorMessage(relError);
          setFormError(`Error al guardar adherentes/terceros vinculados: ${msg}`);
          setSaving(false);
          return;
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

  const handleAddPendingAdherente = () => {
    if (!relacionAderenteData.caracterAfiliado) {
      setAdherenteError('Seleccioná el carácter del afiliado');
      return;
    }
    if (modoAdherente === 'existente') {
      if (!selectedAderenteId) { setAdherenteError('Seleccioná un aderente existente'); return; }
      const existing = aderentes.find(a => a.id === selectedAderenteId);
      if (!existing) return;
      if (pendingAdherentes.some(p => p.id === selectedAderenteId)) { setAdherenteError('Ya fue agregado'); return; }
      setAdherenteError('');
      setPendingAdherentes(prev => [...prev, {
        id: existing.id,
        nombre: existing.nombre,
        apellido: existing.apellido,
        caracterAfiliado: relacionAderenteData.caracterAfiliado,
        telefono: existing.telefono,
        direccion: existing.direccion,
        email: existing.email,
        codigoPostal: existing.codigoPostal,
      }]);
      setSelectedAderenteId('');
      setRelacionAderenteData({ caracterAfiliado: '', observaciones: '' });
      return;
    }
    if (!nuevaAderenteData.nombre || !nuevaAderenteData.apellido) {
      setAdherenteError('Completá nombre y apellido');
      return;
    }
    setAdherenteError('');
    setPendingAdherentes(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      ...nuevaAderenteData,
      caracterAfiliado: relacionAderenteData.caracterAfiliado,
    }]);
    setNuevaAderenteData({ nombre: '', apellido: '', telefono: '', direccion: '', email: '', codigoPostal: '' });
    setRelacionAderenteData({ caracterAfiliado: '', observaciones: '' });
  };

  const handleAddPendingTercero = () => {
    if (!relTerceroFormData.tipoRelacion) { setTerceroVinculadoError('Seleccioná el tipo de relación'); return; }
    if (modoTercero === 'existente' && !relTerceroFormData.tercerosVinculadoId) { setTerceroVinculadoError('Seleccioná un tercero vinculado'); return; }
    if (modoTercero === 'nuevo') {
      if (!nuevoTerceroVinculadoData.apellido || !nuevoTerceroVinculadoData.nombre || !nuevoTerceroVinculadoData.dni || !nuevoTerceroVinculadoData.fechaNacimiento) {
        setTerceroVinculadoError('Completá apellido, nombre, DNI y fecha de nacimiento');
        return;
      }
    }
    setTerceroVinculadoError('');
    const terceroNombre = modoTercero === 'nuevo'
      ? `${nuevoTerceroVinculadoData.apellido}, ${nuevoTerceroVinculadoData.nombre}`
      : (() => { const t = terceros.find(x => x.id === relTerceroFormData.tercerosVinculadoId); return t ? `${t.apellido}, ${t.nombre}` : ''; })();
    setPendingTerceros(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      tipoRelacion: relTerceroFormData.tipoRelacion,
      observaciones: relTerceroFormData.observaciones || undefined,
      modo: modoTercero,
      tercerosVinculadoId: modoTercero === 'existente' ? relTerceroFormData.tercerosVinculadoId : undefined,
      terceroNombre,
      nuevoDatos: modoTercero === 'nuevo' ? { ...nuevoTerceroVinculadoData } : undefined,
    }]);
    setRelTerceroFormData({ tipoRelacion: '', observaciones: '', tercerosVinculadoId: '' });
    setNuevoTerceroVinculadoData({ nombre: '', apellido: '', dni: '', fechaNacimiento: '', telefono: '', email: '' });
    setModoTercero('existente');
  };

  const tipoRelacionOptions = [
    'Padre/Madre', 'Hijo/Hija', 'Cónyuge', 'Hermano/Hermana', 'Tutor', 'Curador', 'Otro',
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este afiliado?')) return;
    try {
      await afiliadosService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(extractErrorMessage(error));
    }
  };

  const filteredAfiliados = useMemo(() =>
    afiliados.filter((a) =>
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.dni.includes(searchTerm) ||
      a.numeroAfiliado.toLowerCase().includes(searchTerm.toLowerCase())
    ), [afiliados, searchTerm]);

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedAfiliados,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredAfiliados, itemsPerPage: 12 });

  const estadoCivilOptions = estadosCiviles.map(ec => ({ value: ec.id, label: ec.nombre }));
  const sexoOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Afiliados
          </h1>
          <p className="text-neutral-600 mt-1">
            {filteredAfiliados.length} afiliado{filteredAfiliados.length !== 1 ? 's' : ''} registrado{filteredAfiliados.length !== 1 ? 's' : ''}
          </p>
        </div>
        {(isAdmin || isSuperAdmin) && (
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Nuevo Afiliado
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI o número de afiliado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Grid de tarjetas */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedAfiliados.map((afiliado) => (
              <div key={afiliado.id} className="premium-card p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <UserCircleIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 leading-tight">
                        {afiliado.apellido}, {afiliado.nombre}
                      </p>
                      <p className="text-xs text-neutral-500">N° {afiliado.numeroAfiliado}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    afiliado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {afiliado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Datos */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">DNI</span>
                    <span className="font-medium text-neutral-800">{afiliado.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Fecha Nac.</span>
                    <span className="font-medium text-neutral-800">
                      {new Date(afiliado.fechaNacimiento).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Edad</span>
                    <span className="font-medium text-neutral-800">{afiliado.edad} años</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Plan</span>
                    <span className="font-bold text-primary-600">{afiliado.plan}</span>
                  </div>
                  {afiliado.celular && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Celular</span>
                      <span className="font-medium text-neutral-800">{afiliado.celular}</span>
                    </div>
                  )}
                  {afiliado.email && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Email</span>
                      <span className="font-medium text-neutral-800 truncate text-xs max-w-[160px]">{afiliado.email}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2 border-t border-neutral-100">
                  <Link
                    href={`/dashboard/afiliados/${afiliado.id}`}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Ver Detalle
                  </Link>
                  {(isAdmin || isSuperAdmin) && (
                    <>
                      <button
                        onClick={() => handleOpenModal(afiliado)}
                        className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(afiliado.id)}
                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {paginatedAfiliados.length === 0 && (
            <div className="premium-card p-12 text-center">
              <UserCircleIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">
                {afiliados.length === 0
                  ? 'No hay afiliados registrados'
                  : 'No se encontraron afiliados con ese criterio'}
              </p>
            </div>
          )}

          {filteredAfiliados.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </>
      )}

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingAfiliado ? 'Editar Afiliado' : 'Nuevo Afiliado'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Datos Personales */}
                <div>
                  <h4 className="text-base font-semibold text-neutral-800 mb-3 pb-2 border-b">Datos Personales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
                      <input type="text" value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.nombre ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                        maxLength={100} />
                      {fieldErrors.nombre && <p className="text-xs text-red-600 mt-1">{fieldErrors.nombre}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Apellido *</label>
                      <input type="text" value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.apellido ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                        maxLength={100} />
                      {fieldErrors.apellido && <p className="text-xs text-red-600 mt-1">{fieldErrors.apellido}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">DNI *</label>
                      <input type="text" value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.dni ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                        maxLength={20} />
                      {fieldErrors.dni && <p className="text-xs text-red-600 mt-1">{fieldErrors.dni}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Nacimiento *</label>
                      <input type="date" value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${fieldErrors.fechaNacimiento ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`} />
                      {fieldErrors.fechaNacimiento && <p className="text-xs text-red-600 mt-1">{fieldErrors.fechaNacimiento}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Sexo</label>
                      <SearchableSelect options={sexoOptions} value={formData.sexo}
                        onChange={(v) => setFormData({ ...formData, sexo: v })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Estado Civil</label>
                      <SearchableSelect options={estadoCivilOptions} value={formData.estadoCivilId || ''}
                        onChange={(v) => setFormData({ ...formData, estadoCivilId: v })}
                        placeholder="Seleccionar..." />
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div>
                  <h4 className="text-base font-semibold text-neutral-800 mb-3 pb-2 border-b">Contacto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                      <input type="email" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={150} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Celular</label>
                      <input type="text" value={formData.celular}
                        onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={30} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono</label>
                      <input type="text" value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={30} />
                    </div>
                  </div>
                </div>

                {/* Domicilio */}
                <div>
                  <h4 className="text-base font-semibold text-neutral-800 mb-3 pb-2 border-b">Domicilio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección</label>
                      <input type="text" value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={200} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Localidad</label>
                      <input type="text" value={formData.localidad}
                        onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={100} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Provincia</label>
                      <input type="text" value={formData.provincia}
                        onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={100} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Código Postal</label>
                      <input type="text" value={formData.codigoPostal}
                        onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={10} />
                    </div>
                  </div>
                </div>

                {/* Afiliación */}
                <div>
                  <h4 className="text-base font-semibold text-neutral-800 mb-3 pb-2 border-b">Datos de Afiliación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">N° Afiliado</label>
                      <input type="text" value={formData.numeroAfiliado}
                        onChange={(e) => setFormData({ ...formData, numeroAfiliado: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={50} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Plan</label>
                      <input type="text" value={formData.plan}
                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        maxLength={100} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="activo" checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded" />
                      <label htmlFor="activo" className="text-sm text-neutral-700">Activo</label>
                    </div>
                  </div>
                </div>

                {/* Adherentes — solo al crear */}
                {!editingAfiliado && (
                  <>
                    {/* Sección Adherentes */}
                    <div>
                      <h4 className="text-base font-semibold text-neutral-800 mb-1 pb-2 border-b flex items-center justify-between">
                        Adherentes
                        <span className="text-xs font-normal text-neutral-400">(opcional)</span>
                      </h4>
                      <p className="text-xs text-neutral-500 mb-3">Reciben los mismos servicios que el titular.</p>

                      {pendingAdherentes.length > 0 && (
                        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <ul className="space-y-1">
                            {pendingAdherentes.map((pa) => (
                              <li key={pa.id} className="flex items-center justify-between text-sm">
                                <span className="text-blue-800">✓ <strong>{pa.apellido}, {pa.nombre}</strong> — {pa.caracterAfiliado}</span>
                                <button type="button" onClick={() => setPendingAdherentes(prev => prev.filter(x => x.id !== pa.id))}
                                  className="text-blue-400 hover:text-red-500 ml-2">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                        <div className="flex rounded-lg border border-neutral-200 overflow-hidden text-sm bg-white">
                          <button type="button" onClick={() => { setModoAdherente('existente'); setAdherenteError(''); }}
                            className={`flex-1 py-1.5 font-medium transition-colors ${
                              modoAdherente === 'existente' ? 'bg-blue-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}>Seleccionar existente</button>
                          <button type="button" onClick={() => { setModoAdherente('nuevo'); setAdherenteError(''); }}
                            className={`flex-1 py-1.5 font-medium transition-colors ${
                              modoAdherente === 'nuevo' ? 'bg-blue-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}>Crear nuevo</button>
                        </div>

                        {modoAdherente === 'existente' && (
                          <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1">Aderente</label>
                            <select value={selectedAderenteId}
                              onChange={e => setSelectedAderenteId(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                              <option value="">Seleccionar...</option>
                              {aderentes.map(a => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} — {a.caracterAfiliado}</option>)}
                            </select>
                            {aderentes.length === 0 && <p className="text-xs text-amber-600 mt-1">No hay aderentes registrados. Usá &ldquo;Crear nuevo&rdquo;.</p>}
                          </div>
                        )}

                        {modoAdherente === 'nuevo' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Apellido *</label>
                              <input type="text" value={nuevaAderenteData.apellido} onChange={e => setNuevaAderenteData(p => ({ ...p, apellido: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Apellido" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Nombre *</label>
                              <input type="text" value={nuevaAderenteData.nombre} onChange={e => setNuevaAderenteData(p => ({ ...p, nombre: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Nombre" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Teléfono</label>
                              <input type="text" value={nuevaAderenteData.telefono} onChange={e => setNuevaAderenteData(p => ({ ...p, telefono: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Teléfono" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                              <input type="email" value={nuevaAderenteData.email} onChange={e => setNuevaAderenteData(p => ({ ...p, email: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Email" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Dirección</label>
                              <input type="text" value={nuevaAderenteData.direccion} onChange={e => setNuevaAderenteData(p => ({ ...p, direccion: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Dirección" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Código Postal</label>
                              <input type="text" value={nuevaAderenteData.codigoPostal} onChange={e => setNuevaAderenteData(p => ({ ...p, codigoPostal: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="CP" /></div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="block text-xs font-medium text-neutral-700 mb-1">Carácter del afiliado *</label>
                            <select value={relacionAderenteData.caracterAfiliado} onChange={e => setRelacionAderenteData(p => ({ ...p, caracterAfiliado: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                              <option value="">Seleccionar...</option>
                              {tipoRelacionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select></div>
                          <div><label className="block text-xs font-medium text-neutral-700 mb-1">Observaciones</label>
                            <input type="text" value={relacionAderenteData.observaciones} onChange={e => setRelacionAderenteData(p => ({ ...p, observaciones: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Opcional..." /></div>
                        </div>

                        {adherenteError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                            {adherenteError}
                          </div>
                        )}
                        <button type="button" onClick={handleAddPendingAdherente}
                          className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                          + Agregar adherente
                        </button>
                      </div>
                    </div>

                    {/* Sección Terceros Vinculados */}
                    <div>
                      <h4 className="text-base font-semibold text-neutral-800 mb-1 pb-2 border-b flex items-center justify-between">
                        Terceros Vinculados
                        <span className="text-xs font-normal text-neutral-400">(opcional)</span>
                      </h4>
                      <p className="text-xs text-neutral-500 mb-3">Pueden no recibir servicios del titular.</p>

                      {pendingTerceros.length > 0 && (
                        <div className="mb-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
                          <ul className="space-y-1">
                            {pendingTerceros.map((pt) => (
                              <li key={pt.id} className="flex items-center justify-between text-sm">
                                <span className="text-violet-800">✓ <strong>{pt.terceroNombre}</strong> — {pt.tipoRelacion}</span>
                                <button type="button" onClick={() => setPendingTerceros(prev => prev.filter(x => x.id !== pt.id))}
                                  className="text-violet-400 hover:text-red-500 ml-2">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                        <div className="flex rounded-lg border border-neutral-200 overflow-hidden text-sm bg-white">
                          <button type="button" onClick={() => setModoTercero('existente')}
                            className={`flex-1 py-1.5 font-medium transition-colors ${
                              modoTercero === 'existente' ? 'bg-violet-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}>Seleccionar existente</button>
                          <button type="button" onClick={() => setModoTercero('nuevo')}
                            className={`flex-1 py-1.5 font-medium transition-colors ${
                              modoTercero === 'nuevo' ? 'bg-violet-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}>Crear nuevo</button>
                        </div>

                        {modoTercero === 'existente' && (
                          <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1">Tercero vinculado</label>
                            <select value={relTerceroFormData.tercerosVinculadoId}
                              onChange={e => setRelTerceroFormData(prev => ({ ...prev, tercerosVinculadoId: e.target.value }))}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 bg-white">
                              <option value="">Seleccionar...</option>
                              {terceros.map(t => <option key={t.id} value={t.id}>{t.apellido}, {t.nombre} — DNI {t.dni}</option>)}
                            </select>
                            {terceros.length === 0 && <p className="text-xs text-amber-600 mt-1">No hay terceros. Usá &ldquo;Crear nuevo&rdquo;.</p>}
                          </div>
                        )}

                        {modoTercero === 'nuevo' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Apellido *</label>
                              <input type="text" value={nuevoTerceroVinculadoData.apellido} onChange={e => setNuevoTerceroVinculadoData(p => ({ ...p, apellido: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Apellido" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Nombre *</label>
                              <input type="text" value={nuevoTerceroVinculadoData.nombre} onChange={e => setNuevoTerceroVinculadoData(p => ({ ...p, nombre: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Nombre" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">DNI *</label>
                              <input type="text" value={nuevoTerceroVinculadoData.dni} onChange={e => setNuevoTerceroVinculadoData(p => ({ ...p, dni: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="DNI" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Fecha de nac. *</label>
                              <input type="date" value={nuevoTerceroVinculadoData.fechaNacimiento} onChange={e => setNuevoTerceroVinculadoData(p => ({ ...p, fechaNacimiento: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Teléfono</label>
                              <input type="text" value={nuevoTerceroVinculadoData.telefono} onChange={e => setNuevoTerceroVinculadoData(p => ({ ...p, telefono: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Teléfono" /></div>
                            <div><label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                              <input type="email" value={nuevoTerceroVinculadoData.email} onChange={e => setNuevoTerceroVinculadoData(p => ({ ...p, email: e.target.value }))}
                                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Email" /></div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="block text-xs font-medium text-neutral-700 mb-1">Tipo de relación *</label>
                            <select value={relTerceroFormData.tipoRelacion} onChange={e => setRelTerceroFormData(p => ({ ...p, tipoRelacion: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-violet-500 bg-white">
                              <option value="">Seleccionar...</option>
                              {tipoRelacionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select></div>
                          <div><label className="block text-xs font-medium text-neutral-700 mb-1">Observaciones</label>
                            <input type="text" value={relTerceroFormData.observaciones} onChange={e => setRelTerceroFormData(p => ({ ...p, observaciones: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm bg-white" placeholder="Opcional..." /></div>
                        </div>

                        {terceroVinculadoError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                            {terceroVinculadoError}
                          </div>
                        )}
                        <button type="button" onClick={handleAddPendingTercero}
                          className="w-full px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">
                          + Agregar tercero vinculado
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {formError && (
                <div className="mx-6 mb-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Error:</span> {formError}
                </div>
              )}

              <div className="flex gap-3 p-6 border-t bg-white">
                <button type="button" onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
                  disabled={saving}>Cancelar</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                  disabled={saving}>{saving ? 'Guardando...' : editingAfiliado ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


