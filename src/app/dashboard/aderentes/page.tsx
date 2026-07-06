'use client';

import { useEffect, useState } from 'react';
import { Aderente } from '@/types';
import { aderentesService } from '@/services/aderentesService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { extractErrorMessage } from '@/lib/errorUtils';
import Link from 'next/link';
import AderenteEditModal from '@/components/AderenteEditModal';

/**
 * F1.8 — versión mínima throwaway. Este contrato de API muere en la Ola 2
 * (aderentes → personas/afiliaciones). No pulir ni extender.
 */
export default function AderentesPage() {
  const [aderentes, setAderentes] = useState<Aderente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAderente, setEditingAderente] = useState<Aderente | null>(null);

  useEffect(() => {
    loadAderentes();
  }, []);

  const loadAderentes = async () => {
    try {
      setLoading(true);
      const data = await aderentesService.getAll();
      setAderentes(data);
    } catch (error) {
      console.error('Error al cargar adherentes:', error);
      alert(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredAderentes = aderentes.filter((a) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      a.nombre.toLowerCase().includes(term) ||
      a.apellido.toLowerCase().includes(term)
    );
  });

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedAderentes,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({ items: filteredAderentes, itemsPerPage: 10 });

  const handleSaved = (updated: Aderente) => {
    setAderentes((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    setEditingAderente(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Adherentes
        </h1>
        <p className="text-neutral-600 mt-2">
          Listado de adherentes vinculados a afiliados
        </p>
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o apellido..."
            className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Apellido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Carácter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    N° Afiliado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Titular
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Activo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedAderentes.map((aderente) => (
                  <tr
                    key={aderente.id}
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => setEditingAderente(aderente)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {aderente.apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {aderente.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {aderente.caracterAfiliado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {aderente.numeroAfiliado || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {aderente.afiliado ? (
                        <Link
                          href={`/dashboard/afiliados/${aderente.afiliado.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 hover:text-primary-900 hover:underline"
                        >
                          {aderente.afiliado.apellido}, {aderente.afiliado.nombre}
                        </Link>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          aderente.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {aderente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedAderentes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No hay adherentes registrados</p>
              </div>
            )}
          </div>
        )}

        {/* Paginación */}
        {!loading && filteredAderentes.length > 0 && (
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

      {/* Modal de edición */}
      {editingAderente && (
        <AderenteEditModal
          aderente={editingAderente}
          onClose={() => setEditingAderente(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
