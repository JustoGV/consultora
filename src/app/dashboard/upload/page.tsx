'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreateAfiliadoDto, CreateCertificadoDiscapacidadDto, EstadoCivil, TipoDiscapacidad } from '@/types';
import { afiliadosService } from '@/services/afiliadosService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { estadoCivilService } from '@/services/estadoCivilService';
import { tipoDiscapacidadService } from '@/services/tipoDiscapacidadService';
import { CheckCircleIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [tiposDiscapacidad, setTiposDiscapacidad] = useState<TipoDiscapacidad[]>([]);

  // Formulario del Afiliado
  const [afiliadoData, setAfiliadoData] = useState<CreateAfiliadoDto>({
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

  // Formulario del Certificado
  const [certificadoData, setCertificadoData] = useState<Omit<CreateCertificadoDiscapacidadDto, 'afiliadoId'>>({
    numeroCertificado: '',
    fechaEmision: '',
    fechaVencimiento: '',
    grado: '',
    observaciones: '',
    tipoDiscapacidadId: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadCatalogos();
  }, []);

  const loadCatalogos = async () => {
    try {
      const [estadosData, tiposData] = await Promise.all([
        estadoCivilService.getAll(),
        tipoDiscapacidadService.getAll(),
      ]);
      setEstadosCiviles(estadosData);
      setTiposDiscapacidad(tiposData);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!afiliadoData.nombre || !afiliadoData.apellido || !afiliadoData.dni || !afiliadoData.fechaNacimiento) {
      alert('Por favor complete todos los campos obligatorios del afiliado');
      return;
    }

    if (!certificadoData.numeroCertificado || !certificadoData.fechaEmision || !certificadoData.tipoDiscapacidadId || !certificadoData.grado) {
      alert('Por favor complete todos los campos obligatorios del certificado');
      return;
    }

    try {
      setLoading(true);

      // 1. Crear el afiliado
      const afiliadoToCreate = {
        ...afiliadoData,
        edad: calculateAge(afiliadoData.fechaNacimiento),
      };

      const nuevoAfiliado = await afiliadosService.create(afiliadoToCreate);

      // 2. Crear el certificado asociado al afiliado
      const certificadoToCreate: CreateCertificadoDiscapacidadDto = {
        ...certificadoData,
        afiliadoId: nuevoAfiliado.id,
      };

      await certificadosDiscapacidadService.create(certificadoToCreate);

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/afiliados');
      }, 2000);
    } catch (error) {
      console.error('Error al crear afiliado y certificado:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-4">
            El afiliado y su certificado de discapacidad han sido creados correctamente.
          </p>
          <p className="text-sm text-gray-500">Redirigiendo a la lista de afiliados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent flex items-center gap-3">
          <DocumentPlusIcon className="w-8 h-8 text-primary-600" />
          Nuevo Afiliado con Certificado
        </h1>
        <p className="text-gray-600 mt-2">
          Complete los datos del afiliado y su certificado de discapacidad
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Datos del Afiliado */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </span>
            Datos del Afiliado
          </h2>

          {/* Datos Personales */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={afiliadoData.nombre}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  value={afiliadoData.apellido}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, apellido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                <input
                  type="text"
                  value={afiliadoData.dni}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, dni: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={afiliadoData.fechaNacimiento}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, fechaNacimiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                <select
                  value={afiliadoData.sexo}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, sexo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                <select
                  value={afiliadoData.estadoCivilId}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, estadoCivilId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {estadosCiviles.map((ec) => (
                    <option key={ec.id} value={ec.id}>
                      {ec.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={afiliadoData.email}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={afiliadoData.telefono}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input
                  type="tel"
                  value={afiliadoData.celular}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, celular: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                />
              </div>
            </div>
          </div>

          {/* Domicilio */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Domicilio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  value={afiliadoData.direccion}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad *</label>
                <input
                  type="text"
                  value={afiliadoData.localidad}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, localidad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                <input
                  type="text"
                  value={afiliadoData.provincia}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, provincia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
                <input
                  type="text"
                  value={afiliadoData.codigoPostal}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, codigoPostal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          {/* Datos de Afiliación */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de Afiliación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Afiliado *</label>
                <input
                  type="text"
                  value={afiliadoData.numeroAfiliado}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, numeroAfiliado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
                <input
                  type="text"
                  value={afiliadoData.plan}
                  onChange={(e) => setAfiliadoData({ ...afiliadoData, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Datos del Certificado */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </span>
            Certificado de Discapacidad
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Certificado *</label>
              <input
                type="text"
                value={certificadoData.numeroCertificado}
                onChange={(e) => setCertificadoData({ ...certificadoData, numeroCertificado: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Discapacidad *</label>
              <select
                value={certificadoData.tipoDiscapacidadId}
                onChange={(e) => setCertificadoData({ ...certificadoData, tipoDiscapacidadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar tipo...</option>
                {tiposDiscapacidad.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grado *</label>
              <select
                value={certificadoData.grado}
                onChange={(e) => setCertificadoData({ ...certificadoData, grado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar grado...</option>
                <option value="Leve">Leve</option>
                <option value="Moderado">Moderado</option>
                <option value="Severo">Severo</option>
                <option value="Muy Severo">Muy Severo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión *</label>
              <input
                type="date"
                value={certificadoData.fechaEmision}
                onChange={(e) => setCertificadoData({ ...certificadoData, fechaEmision: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                value={certificadoData.fechaVencimiento}
                onChange={(e) => setCertificadoData({ ...certificadoData, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={certificadoData.observaciones}
                onChange={(e) => setCertificadoData({ ...certificadoData, observaciones: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength={500}
                placeholder="Información adicional sobre el certificado..."
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mt-6">
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <DocumentPlusIcon className="w-5 h-5" />
                  Crear Afiliado y Certificado
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
