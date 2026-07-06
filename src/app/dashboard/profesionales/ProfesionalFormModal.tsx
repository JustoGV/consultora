'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Profesional, CreateProfesionalDto } from '@/types';
import { profesionalesService } from '@/services/profesionalesService';
import { mapServerErrors } from '@/lib/errorUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';
import { useContinuousCreate } from '@/hooks/useContinuousCreate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function emptyForm(administradoraId: string): CreateProfesionalDto {
  return {
    nombre: '',
    apellido: '',
    matricula: '',
    especialidad: '',
    cuit: '',
    telefono: '',
    email: '',
    direccion: '',
    localidad: '',
    administradoraId,
    activo: true,
  };
}

/** Omite claves vacías del payload: `""` nunca viaja en opcionales (RN-17/F1.4). */
function buildPayload(data: CreateProfesionalDto): CreateProfesionalDto {
  const payload = { ...data };
  (Object.keys(payload) as (keyof CreateProfesionalDto)[]).forEach((key) => {
    if (payload[key] === '') {
      (payload as Record<string, unknown>)[key] = undefined;
    }
  });
  return payload;
}

interface ProfesionalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesional: Profesional | null; // null = alta
  onSaved: (profesional: Profesional) => void;
  /** Modo carga continua por defecto (listado = true; edición desde fila = false). */
  defaultContinuous?: boolean;
}

export default function ProfesionalFormModal({
  open,
  onOpenChange,
  profesional,
  onSaved,
  defaultContinuous = true,
}: ProfesionalFormModalProps) {
  const { user } = useAuth();
  const administradoraId = user?.administradoraId || '';

  const [formData, setFormData] = useState<CreateProfesionalDto>(() => emptyForm(administradoraId));
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const isEditing = !!profesional;

  const resetForm = () => {
    const next = profesional
      ? {
          nombre: profesional.nombre,
          apellido: profesional.apellido,
          matricula: profesional.matricula,
          especialidad: profesional.especialidad || '',
          cuit: profesional.cuit || '',
          telefono: profesional.telefono || '',
          email: profesional.email || '',
          direccion: profesional.direccion || '',
          localidad: profesional.localidad || '',
          administradoraId: profesional.administradoraId,
          activo: profesional.activo,
        }
      : emptyForm(administradoraId);
    setFormData(next);
    setInitialSnapshot(JSON.stringify(next));
    setFieldErrors({});
    setFormError(null);
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profesional]);

  const isDirty = useMemo(() => JSON.stringify(formData) !== initialSnapshot, [formData, initialSnapshot]);

  const { continuous, setContinuous, showSavedBanner, handleCreateSuccess } = useContinuousCreate({
    defaultContinuous,
    onReset: resetForm,
    formRef,
  });

  const setField = <K extends keyof CreateProfesionalDto>(key: K, value: CreateProfesionalDto[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateAll = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim()) errors.nombre = 'Requerido';
    if (!formData.apellido.trim()) errors.apellido = 'Requerido';
    if (!formData.matricula.trim()) errors.matricula = 'Requerido';
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateAll();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    try {
      setSaving(true);
      const payload = buildPayload(formData);

      if (isEditing && profesional) {
        const updated = await profesionalesService.update(profesional.id, payload);
        onSaved(updated);
        onOpenChange(false);
      } else {
        const created = await profesionalesService.create(payload);
        onSaved(created);
        handleCreateSuccess(() => onOpenChange(false));
      }
    } catch (error) {
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(formData));
      // 409 de matrícula duplicada → campo matrícula (el backend puede no
      // devolver un array de mensajes para el ConflictException).
      const conflict =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status === 409
          : false;
      if (conflict && !fe.matricula) {
        fe.matricula = 'Ya existe un profesional con esa matrícula';
      }
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (gf && !conflict) setFormError(gf);
      focusFirstError(fe);
    } finally {
      setSaving(false);
    }
  };

  const { onKeyDown, handleEscape, focusFirstError } = useFormKeyboard({
    formRef,
    onSubmit: handleSubmit,
    onClose: () => onOpenChange(false),
    isDirty,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleEscape();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar profesional' : 'Nuevo profesional'}</DialogTitle>
          <DialogDescription>Datos de identidad y matrícula de quien ejecuta la prestación.</DialogDescription>
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
          {showSavedBanner && (
            <div className="rounded-md border border-[var(--sev-baja)] bg-[var(--sev-baja-bg)] px-3 py-2 text-sm text-[var(--sev-baja-fg)]">
              ✓ Guardado — {formData.apellido}, {formData.nombre}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Apellido" required error={fieldErrors.apellido}>
              <Input
                name="apellido"
                value={formData.apellido}
                onChange={(e) => setField('apellido', e.target.value)}
                autoComplete="off"
                aria-invalid={!!fieldErrors.apellido}
              />
            </Field>
            <Field label="Nombre" required error={fieldErrors.nombre}>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                autoComplete="off"
                aria-invalid={!!fieldErrors.nombre}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Matrícula" required error={fieldErrors.matricula}>
              <Input
                name="matricula"
                value={formData.matricula}
                onChange={(e) => setField('matricula', e.target.value)}
                className="tabular-nums"
                autoComplete="off"
                aria-invalid={!!fieldErrors.matricula}
              />
            </Field>
            <Field label="Especialidad" error={fieldErrors.especialidad}>
              <Input
                name="especialidad"
                value={formData.especialidad}
                onChange={(e) => setField('especialidad', e.target.value)}
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CUIT" error={fieldErrors.cuit}>
              <Input
                name="cuit"
                value={formData.cuit}
                onChange={(e) => setField('cuit', e.target.value)}
                className="tabular-nums"
                autoComplete="off"
                aria-invalid={!!fieldErrors.cuit}
              />
            </Field>
            <Field label="Teléfono">
              <Input
                name="telefono"
                value={formData.telefono}
                onChange={(e) => setField('telefono', e.target.value)}
                className="tabular-nums"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" error={fieldErrors.email}>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setField('email', e.target.value)}
                autoComplete="off"
                aria-invalid={!!fieldErrors.email}
              />
            </Field>
            <Field label="Dirección">
              <Input
                name="direccion-sistema"
                value={formData.direccion}
                onChange={(e) => setField('direccion', e.target.value)}
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Localidad">
              <Input
                name="localidad-sistema"
                value={formData.localidad}
                onChange={(e) => setField('localidad', e.target.value)}
                autoComplete="off"
              />
            </Field>
          </div>

          {formError && (
            <div className="rounded-md border border-[var(--sev-critica)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            {!isEditing ? (
              <label className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => setContinuous(e.target.checked)}
                  className="size-4 rounded border-[var(--border-strong)]"
                />
                Seguir cargando
              </label>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleEscape} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--fg)]">
        {label} {required && <span className="text-[var(--sev-critica)]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--sev-critica-fg)]">{error}</p>}
    </div>
  );
}
