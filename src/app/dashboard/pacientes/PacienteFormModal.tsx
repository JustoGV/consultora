'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Persona, CreatePersonaDto, TipoDocumento, EstadoCivil } from '@/types';
import { personasService } from '@/services/personasService';
import { estadoCivilService } from '@/services/estadoCivilService';
import { mapServerErrors } from '@/lib/errorUtils';
import {
  isValidDni,
  isValidCuil,
  isValidEmailFormat,
  isValidFechaNacimiento,
} from '@/lib/formUtils';
import { getLastLocation, saveLastLocation } from '@/lib/frequency';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';
import { useContinuousCreate } from '@/hooks/useContinuousCreate';
import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIL', label: 'CUIL' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro' },
];

const SEXO_OPTIONS = [
  { value: 'M', label: 'M — Masculino' },
  { value: 'F', label: 'F — Femenino' },
  { value: 'X', label: 'X — Tercer género' },
];

function emptyForm(administradoraId: string): CreatePersonaDto {
  return {
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    cuil: '',
    fechaNacimiento: '',
    sexo: '',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    estadoCivilId: '',
    administradoraId,
    activo: true,
  };
}

/** Omite claves vacías del payload: `""` nunca viaja en opcionales (RN-17/F1.4). */
function buildPayload(data: CreatePersonaDto): CreatePersonaDto {
  const payload = { ...data };
  (Object.keys(payload) as (keyof CreatePersonaDto)[]).forEach((key) => {
    if (payload[key] === '') {
      (payload as Record<string, unknown>)[key] = undefined;
    }
  });
  return payload;
}

interface DuplicateMatch {
  id: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

interface PacienteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null; // null = alta
  onSaved: (persona: Persona) => void;
  /** Modo carga continua por defecto (listado = true; edición desde ficha = false). */
  defaultContinuous?: boolean;
}

export default function PacienteFormModal({
  open,
  onOpenChange,
  persona,
  onSaved,
  defaultContinuous = true,
}: PacienteFormModalProps) {
  const { user } = useAuth();
  const administradoraId = user?.administradoraId || '';

  const [formData, setFormData] = useState<CreatePersonaDto>(() => emptyForm(administradoraId));
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);

  // UX-3.1 — duplicado por documento
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [duplicateIgnored, setDuplicateIgnored] = useState(false);
  const duplicateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Invalida un chequeo de duplicado en vuelo cuando el form se resetea (submit
  // exitoso en modo continuo, o cierre) — evita que una respuesta tardía del
  // debounce pise el estado ya limpio (bug detectado en verificación manual:
  // crear "Lucas" con el debounce de "Ana" todavía pendiente mostraba el banner
  // de Ana sobre el form recién reseteado para la siguiente carga).
  const duplicateRequestIdRef = useRef(0);

  const formRef = useRef<HTMLDivElement>(null);
  const isEditing = !!persona;

  const resetForm = () => {
    const next = persona
      ? {
          nombre: persona.nombre,
          apellido: persona.apellido,
          tipoDocumento: persona.tipoDocumento,
          numeroDocumento: persona.numeroDocumento,
          cuil: persona.cuil || '',
          fechaNacimiento: persona.fechaNacimiento?.slice(0, 10) || '',
          sexo: persona.sexo || '',
          email: persona.email || '',
          telefono: persona.telefono || '',
          celular: persona.celular || '',
          direccion: persona.direccion || '',
          localidad: persona.localidad || '',
          provincia: persona.provincia || '',
          codigoPostal: persona.codigoPostal || '',
          estadoCivilId: persona.estadoCivilId || '',
          administradoraId: persona.administradoraId,
          activo: persona.activo,
        }
      : emptyForm(administradoraId);
    setFormData(next);
    setInitialSnapshot(JSON.stringify(next));
    setFieldErrors({});
    setFormError(null);
    setDuplicateMatch(null);
    setDuplicateIgnored(false);
    // Invalida cualquier chequeo de duplicado en vuelo: su respuesta, si llega
    // después, se descarta (ver guard en checkDuplicate).
    duplicateRequestIdRef.current += 1;
    if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, persona]);

  useEffect(() => {
    estadoCivilService
      .getAll()
      .then(setEstadosCiviles)
      .catch(() => setEstadosCiviles([]));
  }, []);

  const isDirty = useMemo(() => JSON.stringify(formData) !== initialSnapshot, [formData, initialSnapshot]);

  const { continuous, setContinuous, showSavedBanner, handleCreateSuccess } = useContinuousCreate({
    defaultContinuous,
    onReset: resetForm,
    formRef,
  });

  const setField = <K extends keyof CreatePersonaDto>(key: K, value: CreatePersonaDto[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // UX-3.1 — duplicado por documento: onBlur / debounce 400ms, mínimo 7 caracteres.
  const checkDuplicate = (numeroDocumento: string) => {
    if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
    const requestId = ++duplicateRequestIdRef.current;
    if (numeroDocumento.trim().length < 7) {
      setDuplicateMatch(null);
      return;
    }
    duplicateTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await personasService.getPaginated({ search: numeroDocumento.trim(), page: 1, limit: 5 });
        // Si el form ya se reseteó (submit en modo continuo) mientras esta
        // request estaba en vuelo, no pisar el estado limpio con una
        // respuesta stale.
        if (requestId !== duplicateRequestIdRef.current) return;
        const match = result.data.find(
          (p) =>
            p.numeroDocumento === numeroDocumento.trim() &&
            p.tipoDocumento === formData.tipoDocumento &&
            p.id !== persona?.id
        );
        setDuplicateMatch(match ? { id: match.id, nombre: match.nombre, apellido: match.apellido, tipoDocumento: match.tipoDocumento, numeroDocumento: match.numeroDocumento } : null);
        setDuplicateIgnored(false);
      } catch {
        /* no bloquea: si falla la búsqueda de duplicado, seguimos */
      }
    }, 400);
  };

  // UX-3.4 — validación en vivo onBlur
  const handleBlurValidate = (field: string) => {
    switch (field) {
      case 'numeroDocumento':
        checkDuplicate(formData.numeroDocumento);
        if (formData.tipoDocumento === 'DNI' && formData.numeroDocumento && !isValidDni(formData.numeroDocumento)) {
          setFieldErrors((prev) => ({ ...prev, numeroDocumento: 'El DNI debe tener 7 u 8 dígitos' }));
        } else {
          clearFieldError('numeroDocumento');
        }
        break;
      case 'cuil':
        if (formData.cuil && !isValidCuil(formData.cuil)) {
          setFieldErrors((prev) => ({ ...prev, cuil: 'CUIL inválido (11 dígitos + verificador)' }));
        } else {
          clearFieldError('cuil');
        }
        break;
      case 'fechaNacimiento':
        if (formData.fechaNacimiento && !isValidFechaNacimiento(formData.fechaNacimiento)) {
          setFieldErrors((prev) => ({ ...prev, fechaNacimiento: 'Fecha inválida (no futura, no > 120 años)' }));
        } else {
          clearFieldError('fechaNacimiento');
        }
        break;
      case 'email':
        if (formData.email && !isValidEmailFormat(formData.email)) {
          setFieldErrors((prev) => ({ ...prev, email: 'Email con formato inválido' }));
        } else {
          clearFieldError('email');
        }
        break;
    }
  };

  const validateAll = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim()) errors.nombre = 'Requerido';
    if (!formData.apellido.trim()) errors.apellido = 'Requerido';
    if (!formData.numeroDocumento.trim()) errors.numeroDocumento = 'Requerido';
    else if (formData.tipoDocumento === 'DNI' && !isValidDni(formData.numeroDocumento)) {
      errors.numeroDocumento = 'El DNI debe tener 7 u 8 dígitos';
    }
    if (formData.cuil && !isValidCuil(formData.cuil)) errors.cuil = 'CUIL inválido (11 dígitos + verificador)';
    if (!formData.fechaNacimiento) errors.fechaNacimiento = 'Requerido';
    else if (!isValidFechaNacimiento(formData.fechaNacimiento)) {
      errors.fechaNacimiento = 'Fecha inválida (no futura, no > 120 años)';
    }
    if (formData.email && !isValidEmailFormat(formData.email)) errors.email = 'Email con formato inválido';
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

      // Chip [Usar {última localidad}/{última provincia}] guarda al confirmar
      // el submit exitoso (no antes) para no ensuciar el localStorage con drafts.
      if (user?.id) {
        saveLastLocation(user.id, { localidad: formData.localidad, provincia: formData.provincia });
      }

      if (isEditing && persona) {
        const updated = await personasService.update(persona.id, payload);
        onSaved(updated);
        onOpenChange(false);
      } else {
        const created = await personasService.create(payload);
        onSaved(created);
        handleCreateSuccess(() => onOpenChange(false));
      }
    } catch (error) {
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(formData));
      // Error 409 de RN-01 → campo numeroDocumento (el backend no siempre
      // devuelve un array de mensajes para el 409 de ConflictException, así
      // que lo mapeamos explícitamente acá si no vino como fieldError).
      const conflict =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status === 409
          : false;
      if (conflict && !fe.numeroDocumento) {
        fe.numeroDocumento = 'Ya existe una persona con ese documento';
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

  const estadoCivilOptions = estadosCiviles.map((e) => ({ value: e.id, label: e.nombre }));
  const lastLocation = user?.id ? getLastLocation(user.id) : null;
  const showLocationChip =
    !!lastLocation &&
    (lastLocation.localidad || lastLocation.provincia) &&
    !formData.localidad &&
    !formData.provincia;

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
          <DialogTitle>{isEditing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
          <DialogDescription>
            Datos de identidad. La obra social y el rol se cargan en Afiliaciones.
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
        {showSavedBanner && (
          <div className="flex items-center gap-2 rounded-md border border-[var(--sev-baja)] bg-[var(--sev-baja-bg)] px-3 py-2 text-sm text-[var(--sev-baja-fg)]">
            <CheckCircle2 className="size-4 shrink-0" />
            Guardado — {formData.apellido}, {formData.nombre}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" required error={fieldErrors.nombre}>
            <Input
              name="nombre"
              value={formData.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              autoComplete="off"
              aria-invalid={!!fieldErrors.nombre}
            />
          </Field>
          <Field label="Apellido" required error={fieldErrors.apellido}>
            <Input
              name="apellido"
              value={formData.apellido}
              onChange={(e) => setField('apellido', e.target.value)}
              autoComplete="off"
              aria-invalid={!!fieldErrors.apellido}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de documento" required>
            <SearchableSelect
              options={TIPOS_DOCUMENTO}
              value={formData.tipoDocumento || 'DNI'}
              onChange={(v) => setField('tipoDocumento', v as TipoDocumento)}
            />
          </Field>
          <Field label="Número de documento" required error={fieldErrors.numeroDocumento}>
            <Input
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={(e) => setField('numeroDocumento', e.target.value)}
              onBlur={() => handleBlurValidate('numeroDocumento')}
              className="tabular-nums"
              autoComplete="off"
              aria-invalid={!!fieldErrors.numeroDocumento}
            />
          </Field>
        </div>

        {/* UX-3.1 — banner de duplicado, nunca bloquea */}
        {duplicateMatch && !duplicateIgnored && (
          <div className="flex items-start gap-2 rounded-md border border-[var(--sev-media)] bg-[var(--sev-media-bg)] px-3 py-2 text-sm text-[var(--sev-media-fg)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <p>
                Ya existe: <strong>{duplicateMatch.apellido}, {duplicateMatch.nombre}</strong> —{' '}
                {duplicateMatch.tipoDocumento} {duplicateMatch.numeroDocumento}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/pacientes/${duplicateMatch.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-medium underline"
                >
                  Abrir ficha <ExternalLink className="size-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => setDuplicateIgnored(true)}
                  className="text-xs font-medium underline"
                >
                  Ignorar y seguir
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="CUIL" error={fieldErrors.cuil}>
            <Input
              name="cuil"
              value={formData.cuil}
              onChange={(e) => setField('cuil', e.target.value)}
              onBlur={() => handleBlurValidate('cuil')}
              className="tabular-nums"
              autoComplete="off"
              aria-invalid={!!fieldErrors.cuil}
            />
          </Field>
          <Field label="Fecha de nacimiento" required error={fieldErrors.fechaNacimiento}>
            <Input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={(e) => setField('fechaNacimiento', e.target.value)}
              onBlur={() => handleBlurValidate('fechaNacimiento')}
              className="tabular-nums"
              aria-invalid={!!fieldErrors.fechaNacimiento}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sexo">
            <SearchableSelect
              options={SEXO_OPTIONS}
              value={formData.sexo || ''}
              onChange={(v) => setField('sexo', v)}
              emptyMessage="Sin opciones"
            />
          </Field>
          <Field label="Estado civil">
            <SearchableSelect
              options={estadoCivilOptions}
              value={formData.estadoCivilId || ''}
              onChange={(v) => setField('estadoCivilId', v)}
              emptyMessage="Sin estados civiles cargados"
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
              onBlur={() => handleBlurValidate('email')}
              autoComplete="off"
              aria-invalid={!!fieldErrors.email}
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
          <Field label="Celular">
            <Input
              name="celular"
              value={formData.celular}
              onChange={(e) => setField('celular', e.target.value)}
              className="tabular-nums"
              autoComplete="off"
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

        <div className="grid grid-cols-3 gap-3">
          <Field label="Localidad">
            <Input
              name="localidad-sistema"
              value={formData.localidad}
              onChange={(e) => setField('localidad', e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Provincia">
            <Input
              name="provincia-sistema"
              value={formData.provincia}
              onChange={(e) => setField('provincia', e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Código postal">
            <Input
              name="codigoPostal-sistema"
              value={formData.codigoPostal}
              onChange={(e) => setField('codigoPostal', e.target.value)}
              className="tabular-nums"
              autoComplete="off"
            />
          </Field>
        </div>

        {/* UX-3.3 — chip sugerido de última localidad/provincia (click explícito) */}
        {showLocationChip && (
          <button
            type="button"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                localidad: lastLocation?.localidad || prev.localidad,
                provincia: lastLocation?.provincia || prev.provincia,
              }));
            }}
            className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-strong)] bg-[var(--surface-sunken)] px-2 py-1 text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]"
          >
            Usar {lastLocation?.localidad || '—'} / {lastLocation?.provincia || '—'}
          </button>
        )}

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
