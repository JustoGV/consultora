'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronsUpDown, X, Loader2 } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectRemoteProps {
  value: string;
  onChange: (value: string) => void;
  fetcher: (search: string) => Promise<Option[]>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  emptyMessage?: string;
  /** Mínimo de caracteres para disparar el fetcher. Default 2. */
  minChars?: number;
  /** Debounce del input de búsqueda antes de llamar al fetcher. Default 300ms. */
  debounceMs?: number;
}

/**
 * SearchableSelectRemote — variante server-driven de `SearchableSelect` (mismo
 * look & feel, mismas clases/estructura), para catálogos que no conviene traer
 * completos al cliente (ej. Personas). En vez de recibir `options` ya armadas,
 * recibe un `fetcher(search)` que se invoca con debounce a medida que el
 * usuario tipea.
 *
 * Conserva el label de la opción seleccionada aunque no esté en el último
 * resultado del fetcher: guarda internamente `{value, label}` de la opción
 * elegida (no solo el `value` string) para poder mostrarla en el trigger
 * incluso si un fetch posterior no la trae. Si el `value` prop cambia
 * externamente (ej. el form se resetea) y no coincide con la opción guardada,
 * se muestra el `value` crudo como fallback (mejor que un trigger vacío
 * silencioso, deja rastro de que hay algo seleccionado aunque no tengamos el label).
 */
export default function SearchableSelectRemote({
  value,
  onChange,
  fetcher,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  required = false,
  emptyMessage = 'No se encontraron resultados',
  minChars = 2,
  debounceMs = 300,
}: SearchableSelectRemoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Si el value externo cambia y no coincide con la opción que tenemos guardada
  // (ej. el form se resetea a ''), soltamos el label guardado.
  useEffect(() => {
    if (selectedOption && selectedOption.value !== value) {
      setSelectedOption(null);
    }
    if (!value) {
      setSelectedOption(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const runFetch = useCallback(
    (term: string) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      fetcher(term)
        .then((results) => {
          if (requestIdRef.current === requestId) {
            setOptions(results);
          }
        })
        .catch(() => {
          if (requestIdRef.current === requestId) {
            setOptions([]);
          }
        })
        .finally(() => {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        });
    },
    [fetcher]
  );

  // Debounce del término de búsqueda -> fetcher, solo si cumple minChars.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.length < minChars) {
      setOptions([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runFetch(searchTerm);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, minChars, debounceMs, runFetch]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enfocar input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setSelectedOption(option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedOption(null);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      // Guard consumido también por handleEnterAsTab (src/lib/formUtils.ts) vía
      // e.defaultPrevented: al hacer preventDefault acá, el form padre no le
      // roba el foco a esta interacción.
      e.preventDefault();
      handleSelect(options[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const displayLabel = selectedOption?.value === value ? selectedOption.label : value || null;
  const showBelowMinChars = searchTerm.length > 0 && searchTerm.length < minChars;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-neutral-300'}
        `}
      >
        <span className={displayLabel ? 'text-gray-900' : 'text-gray-400'}>
          {displayLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronsUpDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Buscando...
              </div>
            ) : showBelowMinChars ? (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                Escribí al menos {minChars} caracteres para buscar
              </div>
            ) : options.length > 0 ? (
              options.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors
                    ${option.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'}
                    ${index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}
                  `}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                {searchTerm.length === 0 ? `Escribí al menos ${minChars} caracteres para buscar` : emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      <input type="hidden" value={value} required={required} />
    </div>
  );
}
