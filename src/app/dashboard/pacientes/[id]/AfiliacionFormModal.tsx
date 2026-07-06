'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Afiliacion, CreateAfiliacionDto, ObraSocial, RolAfiliacion, Administradora } from '@/types';
import { afiliacionesService } from '@/services/afiliacionesService';
import { obrasSocialesService } from '@/services/obrasSocialesService';
import { administradoraService } from '@/services/administradoraService';
import { mapServerErrors } from '@/lib/errorUtils';
import { sortByFrequency, bumpFrequency, OBRA_SOCIAL_FREQUENCY_NS } from '@/lib/frequency';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';
import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROL_OPTIONS: { value: RolAfiliacion; label: string }[] = [
  { value: 'TITULAR', label: 'Titular' },
  { value: 'ADHERENTE', label: 'Adherente' },
];

interface AfiliacionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaId: string;
  administradoraId: string;
  onSaved: (afiliacion: Afiliacion) => void;
}

/**
 * Modal "Agregar afiliación" (F2.4 sección 2). Preset RN-14: si la
 * administradora del user tiene `obraSocialPredeterminadaId`, se preselecciona
 * (editable). UX-3.3: opciones de obra social ordenadas por frecuencia de uso
 * del operador (localStorage, contador simple).
 */
export default function AfiliacionFormModal({
  open,
  onOpenChange,
  personaId,
  administradoraId,
  onSaved,
}: AfiliacionFormModalProps) {
  const { user } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [administradora, setAdministradora] = useState<Administradora | null>(null);

  const initial: CreateAfiliacionDto = {
    personaId,
    obraSocialId: '',
    rol: 'TITULAR',
    numeroAfiliado: '',
    plan: '',
    fechaAlta: '',
    observaciones: '',
    administradoraId,
    activo: true,
  };

  const [formData, setFormData] = useState<CreateAfiliacionDto>(initial);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    obrasSocialesService.getAll().then(setObrasSociales).catch(() => setObrasSociales([]));
    if (administradoraId) {
      administradoraService
        .getById(administradoraId)
        .then(setAdministradora)
        .catch(() => setAdministradora(null));
    }
  }, [open, administradoraId]);

  const resetForm = (presetObraSocialId?: string) => {
    const next = { ...initial, obraSocialId: presetObraSocialId || '' };
    setFormData(next);
    setInitialSnapshot(JSON.stringify(next));
    setFieldErrors({});
    setFormError(null);
  };

  // Preset RN-14: default editable de la OS predeterminada de la administradora.
  useEffect(() => {
    if (open) resetForm(administradora?.obraSocialPredeterminadaId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, administradora]);

  const isDirty = useMemo(() => JSON.stringify(formData) !== initialSnapshot, [formData, initialSnapshot]);

  const setField = <K extends keyof CreateAfiliacionDto>(key: K, value: CreateAfiliacionDto[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const orderedObrasSociales = user?.id
    ? sortByFrequency(obrasSociales, OBRA_SOCIAL_FREQUENCY_NS, user.id, (o) => o.id)
    : obrasSociales;

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!formData.obraSocialId) errors.obraSocialId = 'Requerido';
    if (!formData.rol) errors.rol = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    try {
      setSaving(true);
      const payload: CreateAfiliacionDto = {
        ...formData,
        numeroAfiliado: formData.numeroAfiliado || undefined,
        plan: formData.plan || undefined,
        fechaAlta: formData.fechaAlta || undefined,
        observaciones: formData.observaciones || undefined,
      };
      const created = await afiliacionesService.create(payload);

      if (user?.id) bumpFrequency(OBRA_SOCIAL_FREQUENCY_NS, user.id, formData.obraSocialId);

      onSaved(created);
      onOpenChange(false);
    } catch (error) {
      const conflict =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status === 409
          : false;
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(formData));
      if (conflict) {
        // RN-04: 409 = ya tiene afiliación activa en esa OS → banner del modal.
        setFormError(gf || 'La persona ya tiene una afiliación activa en esa obra social.');
      } else {
        setFieldErrors((prev) => ({ ...prev, ...fe }));
        if (gf) setFormError(gf);
      }
    } finally {
      setSaving(false);
    }
  };

  const { onKeyDown, handleEscape } = useFormKeyboard({
    formRef,
    onSubmit: handleSubmit,
    onClose: () => onOpenChange(false),
    isDirty,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleEscape();
        }}
      >
        <DialogHeader>
          <DialogTitle>Agregar afiliación</DialogTitle>
          <DialogDescription>Membresía del paciente con una obra social.</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef as unknown as React.RefObject<HTMLFormElement>}
          onKeyDown={onKeyDown}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          autoComplete="off"
          className="space-y-4 pt-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--fg)]">
              Obra Social <span className="text-[var(--sev-critica)]">*</span>
            </label>
            <SearchableSelect
              options={orderedObrasSociales.map((o) => ({ value: o.id, label: o.nombre }))}
              value={formData.obraSocialId}
              onChange={(v) => setField('obraSocialId', v)}
              placeholder="Seleccionar obra social"
            />
            {fieldErrors.obraSocialId && (
              <p className="mt-1 text-xs text-[var(--sev-critica-fg)]">{fieldErrors.obraSocialId}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--fg)]">
              Rol <span className="text-[var(--sev-critica)]">*</span>
            </label>
            <SearchableSelect
              options={ROL_OPTIONS}
              value={formData.rol}
              onChange={(v) => setField('rol', v as RolAfiliacion)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--fg)]">N° afiliado</label>
              <Input
                name="numeroAfiliado"
                value={formData.numeroAfiliado}
                onChange={(e) => setField('numeroAfiliado', e.target.value)}
                className="tabular-nums"
                autoComplete="off"
                placeholder="Texto libre"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--fg)]">Plan</label>
              <Input
                name="plan"
                value={formData.plan}
                onChange={(e) => setField('plan', e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--fg)]">Fecha de alta</label>
            <Input
              type="date"
              name="fechaAlta"
              value={formData.fechaAlta}
              onChange={(e) => setField('fechaAlta', e.target.value)}
              className="tabular-nums"
            />
          </div>

          {formError && (
            <div className="rounded-md border border-[var(--sev-critica)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <Button type="button" variant="outline" onClick={handleEscape} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
