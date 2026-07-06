'use client';

import { useEffect, useState } from 'react';
import { Aderente, UpdateAderenteDto } from '@/types';
import { aderentesService } from '@/services/aderentesService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { mapServerErrors } from '@/lib/errorUtils';
import { handleEnterAsTab } from '@/lib/formUtils';

// Carácter del afiliado: mismas opciones que tipoRelacionOptions en afiliados/page.tsx (F1.7).
const caracterOptions = [
  'Hijo/a', 'Cónyuge', 'Conviviente', 'Padre', 'Madre', 'Tutor/a', 'Curador/a', 'Hermano/a', 'Otro',
];

interface AderenteEditModalProps {
  aderente: Aderente;
  onClose: () => void;
  onSaved: (aderente: Aderente) => void;
}

/**
 * Modal mínimo de edición de Aderente (F1.8 — throwaway hasta Ola 2).
 * Campos del CreateAderenteDto actual SIN email.
 */
export default function AderenteEditModal({ aderente, onClose, onSaved }: AderenteEditModalProps) {
  const [formData, setFormData] = useState({
    nombre: aderente.nombre,
    apellido: aderente.apellido,
    caracterAfiliado: aderente.caracterAfiliado,
    telefono: aderente.telefono || '',
    direccion: aderente.direccion || '',
    codigoPostal: aderente.codigoPostal || '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      nombre: aderente.nombre,
      apellido: aderente.apellido,
      caracterAfiliado: aderente.caracterAfiliado,
      telefono: aderente.telefono || '',
      direccion: aderente.direccion || '',
      codigoPostal: aderente.codigoPostal || '',
    });
    setFormError('');
    setFieldErrors({});
  }, [aderente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.nombre) errors.nombre = 'Requerido';
    if (!formData.apellido) errors.apellido = 'Requerido';
    if (!formData.caracterAfiliado) errors.caracterAfiliado = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      const dto: UpdateAderenteDto = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        caracterAfiliado: formData.caracterAfiliado,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        codigoPostal: formData.codigoPostal || undefined,
      };
      const updated = await aderentesService.update(aderente.id, dto);
      onSaved(updated);
    } catch (error) {
      console.error('Error al guardar adherente:', error);
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(formData));
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (gf) setFormError(gf);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h3 className="text-xl font-semibold text-neutral-900">Editar Adherente</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleEnterAsTab} autoComplete="off" className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Apellido *</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.apellido ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                autoComplete="off"
              />
              {fieldErrors.apellido && <p className="text-xs text-red-600 mt-1">{fieldErrors.apellido}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.nombre ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                autoComplete="off"
              />
              {fieldErrors.nombre && <p className="text-xs text-red-600 mt-1">{fieldErrors.nombre}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Carácter del afiliado *</label>
            <select
              value={formData.caracterAfiliado}
              onChange={(e) => setFormData({ ...formData, caracterAfiliado: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.caracterAfiliado ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
            >
              <option value="">Seleccionar...</option>
              {caracterOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {fieldErrors.caracterAfiliado && <p className="text-xs text-red-600 mt-1">{fieldErrors.caracterAfiliado}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.telefono ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
              autoComplete="off"
            />
            {fieldErrors.telefono && <p className="text-xs text-red-600 mt-1">{fieldErrors.telefono}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.direccion ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                autoComplete="off"
              />
              {fieldErrors.direccion && <p className="text-xs text-red-600 mt-1">{fieldErrors.direccion}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Código Postal</label>
              <input
                type="text"
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${fieldErrors.codigoPostal ? 'border-red-500 bg-red-50' : 'border-neutral-300'}`}
                autoComplete="off"
              />
              {fieldErrors.codigoPostal && <p className="text-xs text-red-600 mt-1">{fieldErrors.codigoPostal}</p>}
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <span className="font-medium">Error:</span> {formError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
