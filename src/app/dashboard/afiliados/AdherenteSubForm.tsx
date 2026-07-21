'use client';

import { useEffect, useState } from 'react';
import { Parentesco, Persona, TipoDocumento } from '@/types';
import { personasService } from '@/services/personasService';
import { parentescosService } from '@/services/parentescosService';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableSelectRemote from '@/components/SearchableSelectRemote';
import { Button } from '@/components/ui/button';
import { Home, Mail, Plus, X } from 'lucide-react';
import {
  IdentityData,
  IdentityFields,
  Field,
  validateIdentity,
  validateIdentityField,
} from './identityFields';

/**
 * A pending adherente held in the parent form's local state until the whole
 * afiliado is saved (UX-12b). Two modes:
 *  - mode 'nuevo': `identity` carries a full draft to create as a new Persona.
 *  - mode 'existente': `personaId` + `personaLabel` reference an existing Persona.
 * `parentescoId` is always required. `_key` is a client-side id for list ops.
 */
export interface PendingAdherente {
  _key: string;
  mode: 'nuevo' | 'existente';
  parentescoId: string;
  parentescoNombre: string;
  // mode 'nuevo'
  identity?: IdentityData;
  // mode 'existente'
  personaId?: string;
  personaLabel?: string;
  /** Existing person's current address emptiness — drives the "heredar domicilio" chip. */
  personaSinDireccion?: boolean;
  /** Whether to copy the titular address into this existing person on save. */
  heredarDomicilio?: boolean;
  /** Existing person's current email emptiness — drives the "heredar email" checkbox. */
  personaSinEmail?: boolean;
  /** Whether to copy the titular email into this existing person on save. */
  heredarEmail?: boolean;
  // edit-mode bookkeeping (adherentes already linked when editing an afiliado)
  existingVinculoId?: string;
  existingAfiliacionAdherenteId?: string;
}

export function emptyAdherenteIdentity(): IdentityData {
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
  };
}

/** The titular's address (4 fields) — offered to adherentes via the "heredar domicilio" chip. */
export interface TitularDomicilio {
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

interface AdherenteSubFormProps {
  /** Persona ids already used (titular + pending adherentes) — excluded from search. */
  excludedPersonaIds: string[];
  /** Documento pairs already pending, to warn on duplicates within the same submit. */
  pendingDocs: { tipoDocumento: TipoDocumento; numeroDocumento: string }[];
  /** Titular's address (4 fields), to offer "heredar domicilio" (UX-13). */
  titularDomicilio?: TitularDomicilio;
  /** Titular's email, to offer "usar email del titular". */
  titularEmail?: string;
  /** When editing an existing adherente item, its draft is passed in to prefill. */
  editing?: PendingAdherente | null;
  onAdd: (adherente: PendingAdherente) => void;
  onCancelEdit?: () => void;
}

/**
 * Inline adherente editor (UX-12b, section 3). Toggle between "Crear nuevo"
 * (reduced identity draft + parentesco) and "Seleccionar existente"
 * (SearchableSelectRemote of personas + parentesco + optional heredar domicilio
 * chip). On "Agregar adherente" it validates and hands a PendingAdherente to
 * the parent list; nothing is persisted here — the parent orchestrates the save.
 */
export default function AdherenteSubForm({
  excludedPersonaIds,
  pendingDocs,
  titularDomicilio,
  titularEmail,
  editing,
  onAdd,
  onCancelEdit,
}: AdherenteSubFormProps) {
  // State is initialized lazily from `editing`. The parent remounts this
  // component (via a changing `key`) whenever the edit target changes, so these
  // initializers re-run fresh — no sync-setState effect needed (avoids React 19
  // cascading-render warnings). After a successful add, the parent unmounts the
  // sub-form entirely, so an in-place reset is not required.
  const [mode, setMode] = useState<'nuevo' | 'existente'>(editing?.mode || 'nuevo');
  const [identity, setIdentity] = useState<IdentityData>(
    editing?.mode === 'nuevo' ? editing.identity || emptyAdherenteIdentity() : emptyAdherenteIdentity()
  );
  const [personaId, setPersonaId] = useState(editing?.personaId || '');
  const [personaLabel, setPersonaLabel] = useState(editing?.personaLabel || '');
  const [personaSel, setPersonaSel] = useState<Persona | null>(null);
  const [heredarDomicilio, setHeredarDomicilio] = useState(!!editing?.heredarDomicilio);
  const [heredarEmail, setHeredarEmail] = useState(!!editing?.heredarEmail);
  const [parentescoId, setParentescoId] = useState(editing?.parentescoId || '');
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    parentescosService.getAll().then(setParentescos).catch(() => setParentescos([]));
  }, []);

  const setField = <K extends keyof IdentityData>(key: K, value: IdentityData[K]) => {
    setIdentity((prev) => ({ ...prev, [key]: value }));
  };

  const onBlurField = (field: keyof IdentityData) => {
    const msg = validateIdentityField(field, identity, true);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const parentescoNombre = parentescos.find((p) => p.id === parentescoId)?.nombre || '';

  const fetcher = async (search: string) => {
    const result = await personasService.getPaginated({ search, page: 1, limit: 20 });
    return result.data
      .filter((p) => !excludedPersonaIds.includes(p.id))
      .map((p) => ({
        value: p.id,
        label: `${p.apellido}, ${p.nombre} — ${p.tipoDocumento} ${p.numeroDocumento}`,
      }));
  };

  const handleSelectPersona = async (id: string) => {
    setPersonaId(id);
    setPersonaSel(null);
    setHeredarDomicilio(false);
    setHeredarEmail(false);
    if (!id) return;
    try {
      const persona = await personasService.getById(id);
      setPersonaSel(persona);
      setPersonaLabel(`${persona.apellido}, ${persona.nombre} — ${persona.tipoDocumento} ${persona.numeroDocumento}`);
    } catch {
      /* label stays whatever the remote select captured */
    }
  };

  const titularTieneDomicilio = !!(
    titularDomicilio &&
    (titularDomicilio.direccion || titularDomicilio.localidad || titularDomicilio.provincia || titularDomicilio.codigoPostal)
  );
  const domicilioTitularLabel = [titularDomicilio?.direccion, titularDomicilio?.localidad]
    .filter(Boolean)
    .join(', ');

  // Modo 'existente': la persona ya vive en la base — el copiado de domicilio
  // es un side-effect que el padre aplica recién al guardar (PATCH separado),
  // por eso acá se ofrece como un checkbox diferido en vez de un botón directo.
  const puedeHeredarDomicilioExistente =
    mode === 'existente' && !!personaSel && !personaSel.direccion && titularTieneDomicilio;

  // Modo 'nuevo': el adherente es un draft local todavía sin persistir — el
  // chip puede aplicar el copiado de una sobre el `identity` state con un
  // botón [Usar], sin esperar al submit.
  const puedeHeredarDomicilioNuevo =
    mode === 'nuevo' && titularTieneDomicilio && !identity.direccion;

  const usarDomicilioTitular = () => {
    if (!titularDomicilio) return;
    setIdentity((prev) => ({
      ...prev,
      direccion: titularDomicilio.direccion || prev.direccion,
      localidad: titularDomicilio.localidad || prev.localidad,
      provincia: titularDomicilio.provincia || prev.provincia,
      codigoPostal: titularDomicilio.codigoPostal || prev.codigoPostal,
    }));
  };

  const puedeHeredarEmailNuevo = mode === 'nuevo' && !!titularEmail && !identity.email;

  const usarEmailTitular = () => {
    if (!titularEmail) return;
    setField('email', titularEmail);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
  };

  // Modo 'existente': la persona sin email propio ofrece heredar el del titular
  // (checkbox diferido, aplicado por el padre con PATCH al guardar).
  const personaSinEmailExistente = mode === 'existente' && !!personaSel && !personaSel.email;

  const handleAdd = () => {
    const nextErrors: Record<string, string> = {};

    if (!parentescoId) nextErrors.parentescoId = 'Requerido';

    if (mode === 'nuevo') {
      Object.assign(nextErrors, validateIdentity(identity, true));
      // Duplicate within the same submit (same tipo+numero already pending).
      const dup = pendingDocs.some(
        (d) =>
          d.numeroDocumento === identity.numeroDocumento.trim() &&
          d.tipoDocumento === identity.tipoDocumento
      );
      if (dup && !nextErrors.numeroDocumento) {
        nextErrors.numeroDocumento = 'Ya agregaste un adherente con ese documento';
      }
    } else {
      if (!personaId) nextErrors.personaId = 'Requerido';
      if (personaSinEmailExistente && !heredarEmail) {
        nextErrors.personaId =
          nextErrors.personaId ||
          'El adherente necesita un email: usá el del titular o cargale uno propio';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const base: PendingAdherente = {
      _key: editing?._key || `adh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      mode,
      parentescoId,
      parentescoNombre,
      existingVinculoId: editing?.existingVinculoId,
      existingAfiliacionAdherenteId: editing?.existingAfiliacionAdherenteId,
    };

    if (mode === 'nuevo') {
      onAdd({ ...base, identity: { ...identity } });
    } else {
      onAdd({
        ...base,
        personaId,
        personaLabel,
        personaSinDireccion: puedeHeredarDomicilioExistente,
        heredarDomicilio: puedeHeredarDomicilioExistente ? heredarDomicilio : false,
        personaSinEmail: personaSinEmailExistente,
        heredarEmail: personaSinEmailExistente ? heredarEmail : false,
      });
    }
    // The parent unmounts this sub-form after a successful add, so no in-place
    // reset is needed here.
  };

  const parentescoOptions = parentescos.map((p) => ({ value: p.id, label: p.nombre }));

  return (
    <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-sunken)] p-4 space-y-4">
      {/* Toggle Crear nuevo | Seleccionar existente */}
      <div className="inline-flex rounded-md border border-[var(--border-strong)] bg-[var(--surface)] p-0.5 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode('nuevo');
            setErrors({});
          }}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${
            mode === 'nuevo'
              ? 'bg-[var(--primary-600)] text-white'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          Crear nuevo
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('existente');
            setErrors({});
          }}
          className={`rounded px-3 py-1.5 font-medium transition-colors ${
            mode === 'existente'
              ? 'bg-[var(--primary-600)] text-white'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
          }`}
        >
          Seleccionar existente
        </button>
      </div>

      {mode === 'nuevo' ? (
        <div className="space-y-4">
          {puedeHeredarDomicilioNuevo && (
            <div className="flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--fg-muted)]">
              <Home className="size-3.5 shrink-0" />
              <span className="flex-1">
                Usar domicilio del titular: {domicilioTitularLabel}
              </span>
              <Button type="button" size="sm" variant="subtle" onClick={usarDomicilioTitular}>
                Usar
              </Button>
            </div>
          )}
          {puedeHeredarEmailNuevo && (
            <div className="flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--fg-muted)]">
              <Mail className="size-3.5 shrink-0" />
              <span className="flex-1">
                Usar email del titular: ({titularEmail})
              </span>
              <Button type="button" size="sm" variant="subtle" onClick={usarEmailTitular}>
                Usar
              </Button>
            </div>
          )}
          <IdentityFields
            data={identity}
            errors={errors}
            namePrefix="adherente"
            setField={setField}
            onBlurField={onBlurField}
            showEstadoCivil={false}
            requireEmail
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Persona" required error={errors.personaId}>
            <SearchableSelectRemote
              value={personaId}
              onChange={handleSelectPersona}
              fetcher={fetcher}
              placeholder="Buscar por nombre, apellido, documento o CUIL/CUIT…"
            />
          </Field>

          {personaSinEmailExistente && (
            <label className="flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--fg-muted)]">
              <input
                type="checkbox"
                checked={heredarEmail}
                disabled={!titularEmail}
                onChange={(e) => setHeredarEmail(e.target.checked)}
                className="size-4 rounded border-[var(--border-strong)]"
              />
              <Mail className="size-3.5 shrink-0" />
              {titularEmail
                ? `Usar email del titular: ${titularEmail}`
                : 'El titular tampoco tiene email cargado'}
            </label>
          )}

          {puedeHeredarDomicilioExistente && (
            <label className="flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--fg-muted)]">
              <input
                type="checkbox"
                checked={heredarDomicilio}
                onChange={(e) => setHeredarDomicilio(e.target.checked)}
                className="size-4 rounded border-[var(--border-strong)]"
              />
              <Home className="size-3.5 shrink-0" />
              Usar domicilio del titular: {domicilioTitularLabel}
            </label>
          )}
        </div>
      )}

      {/* Parentesco (both modes) */}
      <Field label="Parentesco / carácter" required error={errors.parentescoId}>
        <SearchableSelect
          options={parentescoOptions}
          value={parentescoId}
          onChange={(v) => {
            setParentescoId(v);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.parentescoId;
              return next;
            });
          }}
          placeholder="Seleccionar parentesco"
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
          {editing ? 'Guardar adherente' : 'Agregar adherente'}
        </Button>
      </div>
    </div>
  );
}
