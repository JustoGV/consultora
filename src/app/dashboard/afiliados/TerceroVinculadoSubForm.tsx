'use client';

import { useState } from 'react';
import { Profesional } from '@/types';
import { profesionalesService } from '@/services/profesionalesService';
import SearchableSelectRemote from '@/components/SearchableSelectRemote';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Field } from './identityFields';

/**
 * A pending vínculo con un tercero vinculado (profesional), held in the parent
 * form's local state until the whole afiliado is saved (UX-16b). Unlike
 * adherentes, terceros vinculados are ALWAYS an existing `Profesional` — they
 * are created in their own screen (/dashboard/profesionales), never inline.
 * `_key` is a client-side id for list ops; `existingLinkId` marks a vínculo
 * already persisted (edit mode, loaded via getProfesionales).
 */
export interface PendingTerceroVinculado {
  _key: string;
  profesionalId: string;
  profesionalLabel: string;
  observaciones?: string;
  existingLinkId?: string;
}

interface TerceroVinculadoSubFormProps {
  /** Profesional ids already pending — excluded from search to avoid duplicates in the same submit. */
  excludedProfesionalIds: string[];
  /** When editing an existing item, its draft is passed in to prefill. */
  editing?: PendingTerceroVinculado | null;
  onAdd: (item: PendingTerceroVinculado) => void;
  onCancelEdit?: () => void;
}

/**
 * Inline tercero-vinculado editor (UX-16b) — mirrors AdherenteSubForm's
 * structure/classes but simplified: no "crear nuevo" mode, only "seleccionar
 * existente" (profesionales are managed in their own screen). Search by
 * nombre/apellido/matrícula via SearchableSelectRemote + optional
 * observaciones. On "Agregar" it hands a PendingTerceroVinculado to the
 * parent list; nothing is persisted here.
 */
export default function TerceroVinculadoSubForm({
  excludedProfesionalIds,
  editing,
  onAdd,
  onCancelEdit,
}: TerceroVinculadoSubFormProps) {
  const [profesionalId, setProfesionalId] = useState(editing?.profesionalId || '');
  const [profesionalLabel, setProfesionalLabel] = useState(editing?.profesionalLabel || '');
  const [observaciones, setObservaciones] = useState(editing?.observaciones || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const labelForProfesional = (p: Profesional) =>
    `${p.apellido}, ${p.nombre} — Mat. ${p.matricula}${p.especialidad ? ` (${p.especialidad})` : ''}`;

  const fetcher = async (search: string) => {
    const result = await profesionalesService.getPaginated({ search, page: 1, limit: 20 });
    return result.data
      .filter((p) => !excludedProfesionalIds.includes(p.id))
      .map((p) => ({ value: p.id, label: labelForProfesional(p) }));
  };

  const handleSelectProfesional = async (id: string) => {
    setProfesionalId(id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.profesionalId;
      return next;
    });
    if (!id) {
      setProfesionalLabel('');
      return;
    }
    try {
      const profesional = await profesionalesService.getById(id);
      setProfesionalLabel(labelForProfesional(profesional));
    } catch {
      /* label stays whatever the remote select captured */
    }
  };

  const handleAdd = () => {
    if (!profesionalId) {
      setErrors({ profesionalId: 'Requerido' });
      return;
    }

    onAdd({
      _key: editing?._key || `terc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      profesionalId,
      profesionalLabel,
      observaciones: observaciones.trim() || undefined,
      existingLinkId: editing?.existingLinkId,
    });
    // The parent unmounts this sub-form after a successful add, so no in-place
    // reset is needed here.
  };

  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-sunken)] p-4 space-y-4">
      <Field label="Profesional" required error={errors.profesionalId}>
        <SearchableSelectRemote
          value={profesionalId}
          onChange={handleSelectProfesional}
          fetcher={fetcher}
          placeholder="Buscar por nombre, apellido o matrícula…"
        />
      </Field>

      <Field label="Observaciones">
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          placeholder="Opcional"
        />
      </Field>

      <div className="flex items-center justify-end gap-2">
        {editing && onCancelEdit && (
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
            <X className="size-4" />
            Cancelar edición
          </Button>
        )}
        <Button type="button" size="sm" onClick={handleAdd}>
          <Plus className="size-4" />
          {editing ? 'Guardar' : 'Agregar tercero vinculado'}
        </Button>
      </div>
    </div>
  );
}
