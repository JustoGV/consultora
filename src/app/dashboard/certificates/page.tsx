'use client';

import { useState, useMemo } from 'react';
import { mockPatients } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentTextIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import CertificateSearch, { SearchFilters } from '@/components/CertificateSearch';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: '',
    disabilityType: '',
    dateFrom: '',
    dateTo: '',
    minDisabilityLevel: '',
    maxDisabilityLevel: ''
  });

  // Obtener todos los certificados con información del paciente
  const allCertificates = useMemo(() => {
    return mockPatients.flatMap(patient => 
      patient.certificates.map(cert => ({
        ...cert,
        patientName: patient.name,
        patientDocument: patient.documentNumber
      }))
    );
  }, []);

  // Filtrar certificados por administradora del usuario actual
  const userCertificates = useMemo(() => {
    if (!user) return [];
    // Global admin sees all certificates
    if (user.administradoraId === 'global') return allCertificates;
    return allCertificates.filter(cert => cert.administradoraId === user.administradoraId);
  }, [allCertificates, user]);

  // Aplicar filtros de búsqueda
  const filteredCertificates = useMemo(() => {
    return userCertificates.filter(cert => {
      const { searchTerm, category, disabilityType, dateFrom, dateTo, minDisabilityLevel, maxDisabilityLevel } = searchFilters;

      // Búsqueda general (nombre, DNI, tipo de discapacidad)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = cert.patientName.toLowerCase().includes(term);
        const matchesDocument = cert.extractedData?.documentNumber?.toLowerCase().includes(term);
        const matchesDisability = cert.extractedData?.disability?.toLowerCase().includes(term);
        
        if (!matchesName && !matchesDocument && !matchesDisability) {
          return false;
        }
      }

      // Filtro por categoría
      if (category && cert.extractedData?.category !== category) {
        return false;
      }

      // Filtro por tipo de discapacidad
      if (disabilityType && !cert.extractedData?.disability?.toLowerCase().includes(disabilityType.toLowerCase())) {
        return false;
      }

      // Filtro por fecha desde
      if (dateFrom && cert.extractedData?.issueDate && cert.extractedData.issueDate < dateFrom) {
        return false;
      }

      // Filtro por fecha hasta
      if (dateTo && cert.extractedData?.issueDate && cert.extractedData.issueDate > dateTo) {
        return false;
      }

      // Filtro por nivel de discapacidad
      if (cert.extractedData?.disabilityLevel) {
        const level = parseInt(cert.extractedData.disabilityLevel.replace('%', ''));
        
        if (minDisabilityLevel && level < parseInt(minDisabilityLevel)) {
          return false;
        }
        
        if (maxDisabilityLevel && level > parseInt(maxDisabilityLevel)) {
          return false;
        }
      }

      return true;
    });
  }, [userCertificates, searchFilters]);

  // Obtener categorías únicas de los certificados del usuario
  const availableCategories = useMemo(() => {
    const categories = new Set(
      userCertificates
        .map(cert => cert.extractedData?.category)
        .filter(Boolean) as string[]
    );
    return Array.from(categories);
  }, [userCertificates]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Certificados de Discapacidad</h1>
        <p className="text-gray-600 mt-2">
          {user?.administradoraName} - {filteredCertificates.length} certificado(s) encontrado(s)
        </p>
      </div>

      {/* Buscador */}
      <CertificateSearch 
        onSearch={setSearchFilters}
        categories={availableCategories}
      />

      {/* Certificates List */}
      <div className="space-y-6">
        {filteredCertificates.map((certificate) => (
          <div key={certificate.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{certificate.patientName}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      <BuildingOfficeIcon className="w-3 h-3" />
                      {user?.administradoraName}
                    </span>
                  </div>
                  
                  {certificate.extractedData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600">Documento</p>
                        <p className="font-medium text-gray-900">{certificate.extractedData.documentNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Tipo de Discapacidad</p>
                        <p className="font-medium text-gray-900">{certificate.extractedData.disability}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Nivel</p>
                        <p className="font-medium text-gray-900">{certificate.extractedData.disabilityLevel}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Categoría</p>
                        <p className="font-medium text-gray-900">{certificate.extractedData.category}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Fecha de Emisión</p>
                        <p className="font-medium text-gray-900">{certificate.extractedData.issueDate}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600">Vencimiento</p>
                        <p className="font-medium text-gray-900">{certificate.extractedData.expiryDate}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Archivo: {certificate.fileName}</span>
                    <span>•</span>
                    <span>Subido: {certificate.uploadDate}</span>
                  </div>

                  {certificate.extractedData?.observations && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Observaciones:</p>
                      <p className="text-sm text-gray-900">{certificate.extractedData.observations}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Ver Detalle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCertificates.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {userCertificates.length === 0 
              ? 'No hay certificados cargados para esta administradora'
              : 'No se encontraron certificados con los filtros aplicados'
            }
          </p>
        </div>
      )}
    </div>
  );
}
