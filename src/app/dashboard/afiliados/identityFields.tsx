'use client';

/**
 * Shared identity-field kit for the all-in-one Afiliado form (UX-12b).
 *
 * Extracts the exact field rendering + AR validation from the legacy identity
 * modal so BOTH the titular section and the inline adherente sub-form render
 * identical inputs: same masks (sanitizeDigits), same live
 * DigitCounter, same onBlur validation, same keyboard flow. Nothing here owns
 * state — the consumer holds the form object and passes setters — so the same
 * kit drives the titular (full identity) and the adherente (reduced identity).
 */

import { TipoDocumento } from '@/types';
import {
  isValidDni,
  isValidCuil,
  isValidEmailFormat,
  isValidFechaNacimiento,
  sanitizeDigits,
  validateTelefonoAR,
  validateCodigoPostalAR,
} from '@/lib/formUtils';
import SearchableSelect from '@/components/SearchableSelect';
import DigitCounter from '@/components/DigitCounter';
import { Input } from '@/components/ui/input';

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIL', label: 'CUIL' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro' },
];

export const SEXO_OPTIONS = [
  { value: 'M', label: 'M — Masculino' },
  { value: 'F', label: 'F — Femenino' },
  { value: 'X', label: 'X — Tercer género' },
];

/** Identity shape shared by titular and adherente drafts. */
export interface IdentityData {
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  cuil?: string;
  fechaNacimiento: string;
  sexo?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  estadoCivilId?: string;
}

/**
 * Validate a single identity field onBlur. Returns the error message or null.
 * `prefix` lets the caller namespace error keys when several identities live in
 * one error map (e.g. `titular.numeroDocumento` vs `adherente.numeroDocumento`).
 */
export function validateIdentityField(
  field: keyof IdentityData,
  data: IdentityData
): string | null {
  switch (field) {
    case 'numeroDocumento':
      if (data.tipoDocumento === 'DNI' && data.numeroDocumento && !isValidDni(data.numeroDocumento)) {
        return 'El DNI debe tener 7 u 8 dígitos';
      }
      return null;
    case 'cuil':
      if (data.cuil && !isValidCuil(data.cuil)) return 'CUIL inválido (11 dígitos + verificador)';
      return null;
    case 'fechaNacimiento':
      if (data.fechaNacimiento && !isValidFechaNacimiento(data.fechaNacimiento)) {
        return 'Fecha inválida (no futura, no > 120 años)';
      }
      return null;
    case 'email':
      if (data.email && !isValidEmailFormat(data.email)) return 'Email con formato inválido';
      return null;
    case 'telefono':
      return validateTelefonoAR(data.telefono || '');
    case 'celular':
      return validateTelefonoAR(data.celular || '');
    case 'codigoPostal':
      return validateCodigoPostalAR(data.codigoPostal || '');
    default:
      return null;
  }
}

/**
 * Full identity validation (submit-time). `required` toggles which fields are
 * mandatory: titular and adherente both require nombre/apellido/documento/
 * fechaNacimiento. Returns a map of field -> message (empty = valid).
 */
export function validateIdentity(data: IdentityData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.nombre.trim()) errors.nombre = 'Requerido';
  if (!data.apellido.trim()) errors.apellido = 'Requerido';
  if (!data.numeroDocumento.trim()) errors.numeroDocumento = 'Requerido';
  else if (data.tipoDocumento === 'DNI' && !isValidDni(data.numeroDocumento)) {
    errors.numeroDocumento = 'El DNI debe tener 7 u 8 dígitos';
  }
  if (data.cuil && !isValidCuil(data.cuil)) errors.cuil = 'CUIL inválido (11 dígitos + verificador)';
  if (!data.fechaNacimiento) errors.fechaNacimiento = 'Requerido';
  else if (!isValidFechaNacimiento(data.fechaNacimiento)) {
    errors.fechaNacimiento = 'Fecha inválida (no futura, no > 120 años)';
  }
  if (data.email && !isValidEmailFormat(data.email)) errors.email = 'Email con formato inválido';
  const errTel = validateTelefonoAR(data.telefono || '');
  if (errTel) errors.telefono = errTel;
  const errCel = validateTelefonoAR(data.celular || '');
  if (errCel) errors.celular = errCel;
  const errCp = validateCodigoPostalAR(data.codigoPostal || '');
  if (errCp) errors.codigoPostal = errCp;
  return errors;
}

/** Field wrapper: label + optional required marker + error/counter row. */
export function Field({
  label,
  required,
  error,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--fg)]">
        {label} {required && <span className="text-[var(--sev-critica)]">*</span>}
      </label>
      {children}
      {(error || counter) && (
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-xs text-[var(--sev-critica-fg)]">{error}</p>
          {counter}
        </div>
      )}
    </div>
  );
}

interface IdentityFieldsProps {
  data: IdentityData;
  errors: Record<string, string>;
  /** namePrefix keeps input `name` attributes unique across titular + adherente. */
  namePrefix?: string;
  setField: <K extends keyof IdentityData>(key: K, value: IdentityData[K]) => void;
  onBlurField: (field: keyof IdentityData) => void;
  /** Adherente sub-form hides estado civil (reduced identity). Default true. */
  showEstadoCivil?: boolean;
  estadoCivilOptions?: { value: string; label: string }[];
  /** onBlur of numeroDocumento can trigger a duplicate check in the parent. */
  onDocumentoBlur?: () => void;
  /** Optional extra content rendered right after the documento row (e.g. duplicate banner). */
  afterDocumento?: React.ReactNode;
}

/**
 * The identity block: name/apellido, tipo+numero documento (+counter, +mask),
 * cuil, fechaNacimiento, sexo, estado civil (optional), email/telefono/celular,
 * direccion/localidad/provincia/CP. Wired to the parent's data + errors.
 */
export function IdentityFields({
  data,
  errors,
  namePrefix = '',
  setField,
  onBlurField,
  showEstadoCivil = true,
  estadoCivilOptions = [],
  onDocumentoBlur,
  afterDocumento,
}: IdentityFieldsProps) {
  const n = (name: string) => (namePrefix ? `${namePrefix}.${name}` : name);
  const isDniOrCuil = data.tipoDocumento === 'DNI' || data.tipoDocumento === 'CUIL';

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" required error={errors.nombre}>
          <Input
            name={n('nombre')}
            value={data.nombre}
            onChange={(e) => setField('nombre', e.target.value)}
            autoComplete="off"
            aria-invalid={!!errors.nombre}
          />
        </Field>
        <Field label="Apellido" required error={errors.apellido}>
          <Input
            name={n('apellido')}
            value={data.apellido}
            onChange={(e) => setField('apellido', e.target.value)}
            autoComplete="off"
            aria-invalid={!!errors.apellido}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de documento" required>
          <SearchableSelect
            options={TIPOS_DOCUMENTO}
            value={data.tipoDocumento || 'DNI'}
            onChange={(v) => setField('tipoDocumento', v as TipoDocumento)}
          />
        </Field>
        <Field
          label="Número de documento"
          required
          error={errors.numeroDocumento}
          counter={
            isDniOrCuil && (
              <DigitCounter
                value={data.numeroDocumento}
                max={data.tipoDocumento === 'DNI' ? 8 : 11}
                min={data.tipoDocumento === 'DNI' ? 7 : 11}
                hasError={!!errors.numeroDocumento}
              />
            )
          }
        >
          <Input
            name={n('numeroDocumento')}
            value={data.numeroDocumento}
            onChange={(e) => {
              const raw = e.target.value;
              const value =
                data.tipoDocumento === 'DNI'
                  ? sanitizeDigits(raw, 8)
                  : data.tipoDocumento === 'CUIL'
                    ? sanitizeDigits(raw, 11)
                    : raw;
              setField('numeroDocumento', value);
            }}
            onBlur={() => {
              onBlurField('numeroDocumento');
              onDocumentoBlur?.();
            }}
            inputMode={isDniOrCuil ? 'numeric' : 'text'}
            maxLength={data.tipoDocumento === 'DNI' ? 8 : data.tipoDocumento === 'CUIL' ? 11 : undefined}
            className="tabular-nums"
            autoComplete="off"
            aria-invalid={!!errors.numeroDocumento}
          />
        </Field>
      </div>

      {afterDocumento}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="CUIL"
          error={errors.cuil}
          counter={<DigitCounter value={data.cuil || ''} max={11} hasError={!!errors.cuil} />}
        >
          <Input
            name={n('cuil')}
            value={data.cuil || ''}
            onChange={(e) => setField('cuil', sanitizeDigits(e.target.value, 11))}
            onBlur={() => onBlurField('cuil')}
            inputMode="numeric"
            maxLength={11}
            className="tabular-nums"
            autoComplete="off"
            aria-invalid={!!errors.cuil}
          />
        </Field>
        <Field label="Fecha de nacimiento" required error={errors.fechaNacimiento}>
          <Input
            type="date"
            name={n('fechaNacimiento')}
            value={data.fechaNacimiento}
            onChange={(e) => setField('fechaNacimiento', e.target.value)}
            onBlur={() => onBlurField('fechaNacimiento')}
            className="tabular-nums"
            aria-invalid={!!errors.fechaNacimiento}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sexo">
          <SearchableSelect
            options={SEXO_OPTIONS}
            value={data.sexo || ''}
            onChange={(v) => setField('sexo', v)}
            emptyMessage="Sin opciones"
          />
        </Field>
        {showEstadoCivil ? (
          <Field label="Estado civil">
            <SearchableSelect
              options={estadoCivilOptions}
              value={data.estadoCivilId || ''}
              onChange={(v) => setField('estadoCivilId', v)}
              emptyMessage="Sin estados civiles cargados"
            />
          </Field>
        ) : (
          <div />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            name={n('email')}
            value={data.email || ''}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => onBlurField('email')}
            autoComplete="off"
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field
          label="Teléfono"
          error={errors.telefono}
          counter={<DigitCounter value={data.telefono || ''} max={13} min={6} hasError={!!errors.telefono} />}
        >
          <Input
            name={n('telefono')}
            value={data.telefono || ''}
            onChange={(e) => setField('telefono', sanitizeDigits(e.target.value, 13))}
            onBlur={() => onBlurField('telefono')}
            inputMode="numeric"
            maxLength={13}
            className="tabular-nums"
            autoComplete="off"
            aria-invalid={!!errors.telefono}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Celular"
          error={errors.celular}
          counter={<DigitCounter value={data.celular || ''} max={13} min={6} hasError={!!errors.celular} />}
        >
          <Input
            name={n('celular')}
            value={data.celular || ''}
            onChange={(e) => setField('celular', sanitizeDigits(e.target.value, 13))}
            onBlur={() => onBlurField('celular')}
            inputMode="numeric"
            maxLength={13}
            className="tabular-nums"
            autoComplete="off"
            aria-invalid={!!errors.celular}
          />
        </Field>
        <Field label="Dirección">
          <Input
            name={n('direccion-sistema')}
            value={data.direccion || ''}
            onChange={(e) => setField('direccion', e.target.value)}
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Localidad">
          <Input
            name={n('localidad-sistema')}
            value={data.localidad || ''}
            onChange={(e) => setField('localidad', e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Provincia">
          <Input
            name={n('provincia-sistema')}
            value={data.provincia || ''}
            onChange={(e) => setField('provincia', e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Código postal" error={errors.codigoPostal}>
          <Input
            name={n('codigoPostal-sistema')}
            value={data.codigoPostal || ''}
            onChange={(e) => setField('codigoPostal', e.target.value.slice(0, 8))}
            onBlur={() => onBlurField('codigoPostal')}
            maxLength={8}
            className="tabular-nums"
            autoComplete="off"
            aria-invalid={!!errors.codigoPostal}
          />
        </Field>
      </div>
    </>
  );
}
