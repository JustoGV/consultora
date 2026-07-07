'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { MagnifyingGlassIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { focusNextField, registerDropdownOpen, registerDropdownClosed } from '@/lib/formUtils';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  emptyMessage?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  required = false,
  emptyMessage = 'No se encontraron resultados'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Filtrar opciones según el término de búsqueda
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener la opción seleccionada
  const selectedOption = options.find(opt => opt.value === value);

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

  // UX-11 — registra el dropdown como abierto/cerrado (formUtils.ts) para que
  // `useFormKeyboard`/`handleEscape` sepa no cerrar el Dialog padre cuando un
  // Escape ya fue consumido acá (ver comentario largo en formUtils.ts sobre
  // por qué Radix intercepta Escape antes de que este componente pueda frenarlo).
  useEffect(() => {
    if (!isOpen) return;
    registerDropdownOpen();
    return () => registerDropdownClosed();
  }, [isOpen]);

  /**
   * `advanceFocus` en `true` solo cuando la selección vino de teclado (Enter
   * en el dropdown, UX-11): mueve el foco al siguiente campo del form a
   * partir del trigger. La selección por MOUSE (click en una opción) NO
   * fuerza salto de foco — se mantiene el comportamiento actual.
   */
  const handleSelect = (optionValue: string, advanceFocus = false) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    if (advanceFocus) {
      // Se ejecuta después de que el dropdown se cierre (próximo tick) para
      // no competir con el propio foco que React podría restaurar en el trigger.
      requestAnimationFrame(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const form = trigger.closest('form') || document.body;
        const advanced = focusNextField(trigger, form as HTMLElement);
        if (!advanced) trigger.focus();
      });
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value, true);
    } else if (e.key === 'Escape') {
      // Cierra SOLO el dropdown (no el modal/Dialog contenedor) y deja el foco
      // en el trigger. `preventDefault`/`stopPropagation` acá son defensa en
      // profundidad, pero NO alcanzan por sí solos: Radix `DialogContent`
      // intercepta Escape con un listener nativo en fase de CAPTURA sobre
      // `document`, que corre antes de que este handler (fase de burbuja) se
      // ejecute. La fuente de verdad real es `registerDropdownOpen`/
      // `isAnyDropdownOpen` (formUtils.ts): `useFormKeyboard.handleEscape`
      // consulta esa bandera antes de cerrar el modal (bug detectado en
      // verificación manual de UX-11: sin la bandera, Escape cerraba el modal
      // entero en vez de solo el dropdown).
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      setSearchTerm('');
      triggerRef.current?.focus();
    }
  };

  /**
   * Teclado en el TRIGGER (cerrado, con foco): Enter/Espacio/ArrowDown abren el
   * dropdown. `preventDefault` en todos los casos manejados evita que Enter
   * dispare un submit del form o que `handleEnterAsTab` (src/lib/formUtils.ts)
   * le robe el foco — ese helper respeta `e.defaultPrevented` (fix a11y F-6,
   * hallazgo de F-5: el trigger era un div sin foco).
   */
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-neutral-300'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
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
                role="combobox"
                aria-expanded
                aria-controls={listboxId}
                aria-activedescendant={
                  highlightedIndex >= 0 && filteredOptions[highlightedIndex]
                    ? `${listboxId}-opt-${highlightedIndex}`
                    : undefined
                }
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div id={listboxId} role="listbox" className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
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
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        value={value}
        required={required}
      />
    </div>
  );
}
