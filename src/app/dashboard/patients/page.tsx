'use client';

import { useState, useMemo } from 'react';
import { mockPatients } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types';
import { MagnifyingGlassIcon, EyeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PatientsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar pacientes que pertenecen a la administradora del usuario actual
  const userPatients = useMemo(() => {
    if (!user) return [];
    // Global admin sees all patients
    if (user.administradoraId === 'global') return mockPatients;
    return mockPatients.filter(patient => 
      patient.administradoras.includes(user.administradoraId)
    );
  }, [user]);

  // Aplicar búsqueda
  const filteredPatients = useMemo(() => {
    return userPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.documentNumber.includes(searchTerm)
    );
  }, [userPatients, searchTerm]);

  // Contar certificados de la administradora actual para cada paciente
  const getAdministradoraCertificatesCount = (patient: Patient) => {
    return patient.certificates.filter(
      cert => cert.administradoraId === user?.administradoraId
    ).length;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
        <p className="text-gray-600 mt-2">
          {user?.administradoraName} - {filteredPatients.length} paciente(s)
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          const certificatesCount = getAdministradoraCertificatesCount(patient);
          const latestCert = patient.certificates
            .filter(cert => cert.administradoraId === user?.administradoraId)
            .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];

          return (
            <div key={patient.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">DNI: {patient.documentNumber}</p>
                  {patient.administradoras.length > 1 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                        <BuildingOfficeIcon className="w-3 h-3" />
                        {patient.administradoras.length} administradoras
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/dashboard/patients/${patient.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <EyeIcon className="w-5 h-5" />
                </Link>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de Nac.:</span>
                  <span className="font-medium text-gray-900">{patient.dateOfBirth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Género:</span>
                  <span className="font-medium text-gray-900">{patient.gender}</span>
                </div>
                {patient.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium text-gray-900">{patient.phone}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Certificados:</span>
                  <span className="font-bold text-blue-600">{certificatesCount}</span>
                </div>
              </div>

              {latestCert && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-600 mb-2">Último certificado:</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {latestCert.extractedData?.disability || 'Sin información'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500">
            {userPatients.length === 0 
              ? 'No hay pacientes registrados para esta administradora'
              : 'No se encontraron pacientes con el criterio de búsqueda'
            }
          </p>
        </div>
      )}
    </div>
  );
}
