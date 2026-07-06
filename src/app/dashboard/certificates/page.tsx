'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentTextIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import CertificateSearch, { SearchFilters } from '@/components/CertificateSearch';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { afiliadosService } from '@/services/afiliadosService';
import { tipoDiscapacidadService } from '@/services/tipoDiscapacidadService';
import { CertificadoDiscapacidad } from '@/types';

interface CertificadoConAfiliado extends CertificadoDiscapacidad {
  afiliadoNombre?: string;
  afiliadoDni?: string;
  tipoDiscapacidadNombre?: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificados, setCertificados] = useState<CertificadoConAfiliado[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificadoConAfiliado | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: '',
    disabilityType: '',
    dateFrom: '',
    dateTo: '',
    minDisabilityLevel: '',
    maxDisabilityLevel: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certificadosData, afiliadosData, tiposData] = await Promise.all([
        certificadosDiscapacidadService.getAll(),
        afiliadosService.getAll(),
        tipoDiscapacidadService.getAll(),
      ]);

      // Combinar datos
      const certificadosConInfo = certificadosData.map(cert => {
        const afiliado = afiliadosData.find(a => a.id === cert.personaId);
        const ids = cert.tipoDiscapacidadIds && cert.tipoDiscapacidadIds.length > 0
          ? cert.tipoDiscapacidadIds
          : cert.tipoDiscapacidadId ? [cert.tipoDiscapacidadId] : [];
        const tipoDiscapacidadNombre = ids
          .map(id => tiposData.find(t => t.id === id)?.nombre)
          .filter(Boolean)
          .join(', ') || 'N/A';
        return {
          ...cert,
          afiliadoNombre: afiliado ? `${afiliado.apellido}, ${afiliado.nombre}` : 'N/A',
          afiliadoDni: afiliado?.dni || 'N/A',
          tipoDiscapacidadNombre,
        };
      });

      setCertificados(certificadosConInfo);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (certificate: CertificadoConAfiliado) => {
    setSelectedCertificate(certificate);
  };

  const handleCloseDetail = () => {
    setSelectedCertificate(null);
  };

  // Filtrar certificados
  const userCertificates = useMemo(() => {
    if (!user) return [];
    return certificados;
  }, [certificados, user]);

  // Aplicar filtros de búsqueda
  const filteredCertificates = useMemo(() => {
    return userCertificates.filter(cert => {
      const { searchTerm, dateFrom, dateTo } = searchFilters;

      // Búsqueda general (nombre, DNI, número certificado)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = cert.afiliadoNombre?.toLowerCase().includes(term);
        const matchesDocument = cert.afiliadoDni?.toLowerCase().includes(term);
        const matchesNumero = cert.numeroCertificado?.toLowerCase().includes(term);
        
        if (!matchesName && !matchesDocument && !matchesNumero) {
          return false;
        }
      }

      // Filtro por fecha desde
      if (dateFrom && cert.fechaEmision) {
        const fechaEmision = new Date(cert.fechaEmision).toISOString().split('T')[0];
        if (fechaEmision < dateFrom) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (dateTo && cert.fechaEmision) {
        const fechaEmision = new Date(cert.fechaEmision).toISOString().split('T')[0];
        if (fechaEmision > dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [userCertificates, searchFilters]);

  // Obtener categorías únicas (tipos de discapacidad)
  const availableCategories = useMemo(() => {
    const tipos = new Set(
      userCertificates
        .map(cert => cert.tipoDiscapacidadNombre)
        .filter(Boolean) as string[]
    );
    return Array.from(tipos);
  }, [userCertificates]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Certificados de Discapacidad</h1>
        <p className="text-gray-600 mt-2">
          {user?.rol === 'admin' ? 'Acceso Global' : 'Tu administradora'} - {filteredCertificates.length} certificado(s) encontrado(s)
        </p>
      </div>

      {/* Buscador */}
      <CertificateSearch 
        onSearch={setSearchFilters}
        categories={availableCategories}
      />

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
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
                        <h3 className="text-lg font-bold text-gray-900">{certificate.afiliadoNombre}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <BuildingOfficeIcon className="w-3 h-3" />
                          {user?.rol === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">N° Certificado</p>
                          <p className="font-medium text-gray-900">{certificate.numeroCertificado}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600">DNI Afiliado</p>
                          <p className="font-medium text-gray-900">{certificate.afiliadoDni}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600">Tipo de Discapacidad</p>
                          <p className="font-medium text-gray-900">{certificate.tipoDiscapacidadNombre}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600">Grado</p>
                          <p className="font-medium text-gray-900">{certificate.grado}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600">Fecha de Emisión</p>
                          <p className="font-medium text-gray-900">
                            {certificate.fechaEmision ? new Date(certificate.fechaEmision).toLocaleDateString('es-AR') : 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600">Vencimiento</p>
                          <p className="font-medium text-gray-900">
                            {certificate.fechaVencimiento ? new Date(certificate.fechaVencimiento).toLocaleDateString('es-AR') : 'Sin vencimiento'}
                          </p>
                        </div>
                      </div>

                      {certificate.observaciones && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Observaciones:</p>
                          <p className="text-sm text-gray-900">{certificate.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => handleOpenDetail(certificate)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
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
        </>
      )}

      {selectedCertificate && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">Detalle del Certificado</h3>
              <button
                onClick={handleCloseDetail}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Afiliado</p>
                  <p className="font-medium text-gray-900">{selectedCertificate.afiliadoNombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">DNI</p>
                  <p className="font-medium text-gray-900">{selectedCertificate.afiliadoDni}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">N° Certificado</p>
                  <p className="font-medium text-gray-900">{selectedCertificate.numeroCertificado}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tipo de Discapacidad</p>
                  <p className="font-medium text-gray-900">{selectedCertificate.tipoDiscapacidadNombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Grado</p>
                  <p className="font-medium text-gray-900">{selectedCertificate.grado}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Fecha de Emisión</p>
                  <p className="font-medium text-gray-900">
                    {selectedCertificate.fechaEmision ? new Date(selectedCertificate.fechaEmision).toLocaleDateString('es-AR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Vencimiento</p>
                  <p className="font-medium text-gray-900">
                    {selectedCertificate.fechaVencimiento
                      ? new Date(selectedCertificate.fechaVencimiento).toLocaleDateString('es-AR')
                      : 'Sin vencimiento'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Estado</p>
                  <p className="font-medium text-gray-900">{selectedCertificate.activo ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>

              {selectedCertificate.observaciones && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Observaciones</p>
                  <p className="text-sm text-gray-900">{selectedCertificate.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
