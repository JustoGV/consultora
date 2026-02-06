'use client';

import { useState, useEffect, useMemo } from 'react';
import { Afiliado } from '@/types';
import { afiliadosService } from '@/services/afiliadosService';
import { MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAfiliados();
  }, []);

  const loadAfiliados = async () => {
    try {
      setLoading(true);
      const data = await afiliadosService.getAll();
      setAfiliados(data);
    } catch (error) {
      console.error('Error al cargar afiliados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar búsqueda
  const filteredAfiliados = useMemo(() => {
    return afiliados.filter(afiliado =>
      afiliado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.dni.includes(searchTerm) ||
      afiliado.numeroAfiliado.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [afiliados, searchTerm]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pacientes (Afiliados)</h1>
        <p className="text-gray-600 mt-2">
          {filteredAfiliados.length} afiliado(s) registrado(s)
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI o número de afiliado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Afiliados Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAfiliados.map((afiliado) => (
              <div key={afiliado.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {afiliado.apellido}, {afiliado.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">DNI: {afiliado.dni}</p>
                    <p className="text-sm text-gray-600">N° Afiliado: {afiliado.numeroAfiliado}</p>
                  </div>
                  <Link
                    href={`/dashboard/afiliados`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de Nac.:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(afiliado.fechaNacimiento).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Edad:</span>
                    <span className="font-medium text-gray-900">{afiliado.edad} años</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Género:</span>
                    <span className="font-medium text-gray-900">
                      {afiliado.sexo === 'M' ? 'Masculino' : 'Femenino'}
                    </span>
                  </div>
                  {afiliado.celular && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Celular:</span>
                      <span className="font-medium text-gray-900">{afiliado.celular}</span>
                    </div>
                  )}
                  {afiliado.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900 truncate text-xs">
                        {afiliado.email}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-bold text-blue-600">{afiliado.plan}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Estado:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        afiliado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {afiliado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAfiliados.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500">
                {afiliados.length === 0
                  ? 'No hay afiliados registrados'
                  : 'No se encontraron afiliados con el criterio de búsqueda'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
