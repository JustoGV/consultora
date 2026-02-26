'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';

export interface SearchFilters {
  searchTerm: string;
  category: string;
  disabilityType: string;
  dateFrom: string;
  dateTo: string;
  minDisabilityLevel: string;
  maxDisabilityLevel: string;
}

interface CertificateSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: string[];
}

export default function CertificateSearch({ onSearch, categories }: CertificateSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: '',
    disabilityType: '',
    dateFrom: '',
    dateTo: '',
    minDisabilityLevel: '',
    maxDisabilityLevel: ''
  });

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFilters = {
      searchTerm: '',
      category: '',
      disabilityType: '',
      dateFrom: '',
      dateTo: '',
      minDisabilityLevel: '',
      maxDisabilityLevel: ''
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de paciente, DNI o tipo de discapacidad..."
            value={filters.searchTerm}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showAdvanced 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          Filtros Avanzados
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
            Limpiar
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <SearchableSelect
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categories.map((cat) => ({ value: cat, label: cat }))
              ]}
              value={filters.category}
              onChange={(value) => handleInputChange('category', value)}
              placeholder="Todas las categorías"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Discapacidad
            </label>
            <input
              type="text"
              placeholder="Ej: Paraplejia, Hipoacusia..."
              value={filters.disabilityType}
              onChange={(e) => handleInputChange('disabilityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleInputChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Discapacidad Mínimo (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filters.minDisabilityLevel}
              onChange={(e) => handleInputChange('minDisabilityLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Discapacidad Máximo (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="100"
              value={filters.maxDisabilityLevel}
              onChange={(e) => handleInputChange('maxDisabilityLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
          {filters.searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Búsqueda: {filters.searchTerm}
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Categoría: {filters.category}
            </span>
          )}
          {filters.disabilityType && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              Tipo: {filters.disabilityType}
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              Fecha: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
            </span>
          )}
          {(filters.minDisabilityLevel || filters.maxDisabilityLevel) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Nivel: {filters.minDisabilityLevel || '0'}% - {filters.maxDisabilityLevel || '100'}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
