'use client';

import { useEffect, useState, useMemo } from 'react';
import { CertificadoDiscapacidad, Afiliado, Diagnostico } from '@/types';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { afiliadosService } from '@/services/afiliadosService';
import { diagnosticoService } from '@/services/diagnosticoService';
import { MagnifyingGlassIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

interface ResultadoBusqueda {
  certificado: CertificadoDiscapacidad;
  afiliado: Afiliado | undefined;
  diagnostico: Diagnostico | undefined;
}

export default function DiagnosticosPage() {
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [certData, afData, diagData] = await Promise.all([
          certificadosDiscapacidadService.getAll(),
          afiliadosService.getAll(),
          diagnosticoService.getAll(),
        ]);
        setCertificados(certData);
        setAfiliados(afData);
        setDiagnosticos(diagData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const resultados: ResultadoBusqueda[] = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    // Only show results when user has typed something
    if (!search) return [];

    return certificados
      .filter((cert) => {
        const afiliado = afiliados.find((a) => a.id === cert.afiliadoId);
        const nombreCompleto = afiliado
          ? `${afiliado.nombre} ${afiliado.apellido}`.toLowerCase()
          : '';
        const numeroCert = cert.numeroCertificado.toLowerCase();
        return nombreCompleto.includes(search) || numeroCert.includes(search);
      })
      .map((cert) => ({
        certificado: cert,
        afiliado: afiliados.find((a) => a.id === cert.afiliadoId),
        diagnostico: diagnosticos.find((d) => d.id === cert.diagnosticoId),
      }));
  }, [searchTerm, certificados, afiliados, diagnosticos]);

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({ items: resultados, itemsPerPage: 10 });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Búsqueda de Diagnósticos
        </h1>
        <p className="text-neutral-600 mt-2">
          Busque un diagnóstico por nombre del afiliado o número de certificado
        </p>
      </div>

      {/* Buscador */}
      <div className="premium-card p-5">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Nombre del afiliado o N° de certificado
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Ej: García Juan  o  CERT-0001..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            autoFocus
          />
        </div>
        {searchTerm.trim() && (
          <p className="text-xs text-neutral-500 mt-2">
            {resultados.length === 0
              ? 'Sin resultados para la búsqueda.'
              : `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}.`}
          </p>
        )}
      </div>

      {/* Tabla de resultados */}
      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : !searchTerm.trim() ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <DocumentMagnifyingGlassIcon className="w-14 h-14 mb-4 opacity-40" />
            <p className="text-base">Ingrese un nombre o número de certificado para comenzar la búsqueda</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <DocumentMagnifyingGlassIcon className="w-14 h-14 mb-4 opacity-40" />
            <p className="text-base">No se encontraron certificados que coincidan con la búsqueda</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      N° Certificado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Afiliado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Código Diagnóstico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Nombre Diagnóstico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Grado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {paginatedItems.map(({ certificado, afiliado, diagnostico }) => (
                    <tr key={certificado.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {certificado.numeroCertificado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {afiliado
                          ? `${afiliado.apellido}, ${afiliado.nombre}`
                          : <span className="text-neutral-400 italic">Desconocido</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {afiliado?.dni ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {diagnostico ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                            {diagnostico.codigo}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-sm italic">Sin diagnóstico</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {diagnostico?.nombre ?? (
                          <span className="text-neutral-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {certificado.grado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            certificado.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {certificado.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalItems > itemsPerPage && (
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
      </div>
    </div>
  );
}
