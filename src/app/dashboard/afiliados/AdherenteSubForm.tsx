'use client';

import { useEffect, useState } from 'react';
import { Parentesco, Persona, TipoDocumento } from '@/types';
import { personasService } from '@/services/personasService';
import { parentescosService } from '@/services/parentescosService';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableSelectRemote from '@/components/SearchableSelectRemote';
import { Button } from '@/components/ui/button';
import { Home, Plus, X } from 'lucide-react';
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

interface AdherenteSubFormProps {
  /** Persona ids already used (titular + pending adherentes) — excluded from search. */
  excludedPersonaIds: string[];
  /** Documento pairs already pending, to warn on duplicates within the same submit. */
  pendingDocs: { tipoDocumento: TipoDocumento; numeroDocumento: string }[];
  /** Titular address, to offer "heredar domicilio" for existing adherentes without one. */
  titularDireccion?: string;
  titularLocalidad?: string;
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
  titularDireccion,
  titularLocalidad,
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
    const msg = validateIdentityField(field, identity);
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
    if (!id) return;
    try {
      const persona = await personasService.getById(id);
      setPersonaSel(persona);
      setPersonaLabel(`${persona.apellido}, ${persona.nombre} — ${persona.tipoDocumento} ${persona.numeroDocumento}`);
    } catch {
      /* label stays whatever the remote select captured */
    }
  };

  const puedeHeredarDomicilio =
    mode === 'existente' && !!personaSel && !personaSel.direccion && !!titularDireccion;

  const handleAdd = () => {
    const nextErrors: Record<string, string> = {};

    if (!parentescoId) nextErrors.parentescoId = 'Requerido';

    if (mode === 'nuevo') {
      Object.assign(nextErrors, validateIdentity(identity));
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
        personaSinDireccion: puedeHeredarDomicilio,
        heredarDomicilio: puedeHeredarDomicilio ? heredarDomicilio : false,
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
          <IdentityFields
            data={identity}
            errors={errors}
            namePrefix="adherente"
            setField={setField}
            onBlurField={onBlurField}
            showEstadoCivil={false}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Persona" required error={errors.personaId}>
            <SearchableSelectRemote
              value={personaId}
              onChange={handleSelectPersona}
              fetcher={fetcher}
              placeholder="Buscar por nombre, apellido, documento o CUIL…"
            />
          </Field>

          {puedeHeredarDomicilio && (
            <label className="flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--fg-muted)]">
              <input
                type="checkbox"
                checked={heredarDomicilio}
                onChange={(e) => setHeredarDomicilio(e.target.checked)}
                className="size-4 rounded border-[var(--border-strong)]"
              />
              <Home className="size-3.5 shrink-0" />
              Usar domicilio del titular: {titularDireccion}
              {titularLocalidad ? `, ${titularLocalidad}` : ''}
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
