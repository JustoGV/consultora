'use client';

import { useEffect, useRef, useState } from 'react';
import { Persona, PersonaProfesional, Profesional } from '@/types';
import { profesionalesService } from '@/services/profesionalesService';
import { personasService } from '@/services/personasService';
import { mapServerErrors } from '@/lib/errorUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';
import SearchableSelectRemote from '@/components/SearchableSelectRemote';
import { Button } from '@/components/ui/button';

interface VincularProfesionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persona (afiliado) sobre la que se vincula el profesional. */
  persona: Persona;
  /** Profesional ids ya vinculados a esta persona (excluidos del buscador). */
  excludedProfesionalIds: string[];
  onVinculado: (link: PersonaProfesional) => void;
}

/**
 * Modal "Vincular tercero vinculado" (UX-17) — análogo a VincularPersonaModal
 * pero simplificado: los profesionales SIEMPRE existen de antemano (se crean
 * en /dashboard/profesionales), así que no hay sub-paso de alta inline. Solo
 * busca con SearchableSelectRemote + observaciones opcional y llama a
 * POST /personas/:id/profesionales — el vínculo es a nivel PERSONA, así que
 * funciona con o sin obra social (particular/paciente de hospital).
 */
export default function VincularProfesionalModal({
  open,
  onOpenChange,
  persona,
  excludedProfesionalIds,
  onVinculado,
}: VincularProfesionalModalProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const [profesionalId, setProfesionalId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setProfesionalId('');
      setObservaciones('');
      setFieldErrors({});
      setFormError(null);
    }
  }, [open]);

  const isDirty = !!profesionalId;

  const fetcher = async (search: string) => {
    const result = await profesionalesService.getPaginated({ search, page: 1, limit: 20 });
    return result.data
      .filter((p) => !excludedProfesionalIds.includes(p.id))
      .map((p: Profesional) => ({
        value: p.id,
        label: `${p.apellido}, ${p.nombre} — Mat. ${p.matricula}${p.especialidad ? ` (${p.especialidad})` : ''}`,
      }));
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!profesionalId) errors.profesionalId = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    try {
      setSaving(true);
      const link = await personasService.linkTerceroVinculado(persona.id, {
        profesionalId,
        observaciones: observaciones.trim() || undefined,
      });
      onVinculado(link);
      onOpenChange(false);
    } catch (error) {
      const conflict =
        (error as { response?: { status?: number } })?.response?.status === 409;
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, ['profesionalId', 'observaciones']);
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (conflict) {
        setFormError('Este profesional ya está vinculado a este afiliado.');
      } else if (gf) {
        setFormError(gf);
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
          <DialogTitle>Vincular tercero vinculado</DialogTitle>
          <DialogDescription>
            Profesional que atiende a {persona.apellido}, {persona.nombre}.
          </DialogDescription>
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
              Profesional <span className="text-[var(--sev-critica)]">*</span>
            </label>
            <SearchableSelectRemote
              value={profesionalId}
              onChange={(v) => {
                setProfesionalId(v);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.profesionalId;
                  return next;
                });
              }}
              fetcher={fetcher}
              placeholder="Buscar por nombre, apellido o matrícula…"
            />
            {fieldErrors.profesionalId && (
              <p className="mt-1 text-xs text-[var(--sev-critica-fg)]">{fieldErrors.profesionalId}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--fg)]">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Opcional"
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
              {saving ? 'Vinculando…' : 'Vincular'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
