'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Persona,
  Afiliacion,
  CreatePersonaDto,
  CreateAfiliacionDto,
  ObraSocial,
  EstadoCivil,
  Administradora,
  Parentesco,
  TipoDocumento,
} from '@/types';
import { personasService } from '@/services/personasService';
import { afiliacionesService } from '@/services/afiliacionesService';
import { obrasSocialesService } from '@/services/obrasSocialesService';
import { estadoCivilService } from '@/services/estadoCivilService';
import { administradoraService } from '@/services/administradoraService';
import { alertasService } from '@/services/alertasService';
import { mapServerErrors, extractErrorMessage } from '@/lib/errorUtils';
import { notify } from '@/lib/toast';
import { sortByFrequency, bumpFrequency, OBRA_SOCIAL_FREQUENCY_NS } from '@/lib/frequency';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';
import SearchableSelect from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  ExternalLink,
  Info,
  Loader2,
  Pencil,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { IdentityData, IdentityFields, Field } from './identityFields';
import AdherenteSubForm, { PendingAdherente } from './AdherenteSubForm';

/** Shape of GET /afiliaciones/:id/grupo for a TITULAR (see afiliaciones.service.ts). */
type GrupoTitular = {
  titular: Afiliacion;
  adherentes: { vinculoId: string; parentesco: Parentesco; afiliacion: Afiliacion }[];
};

function emptyTitular(): IdentityData {
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
  };
}

function identityFromPersona(p: Persona): IdentityData {
  return {
    nombre: p.nombre,
    apellido: p.apellido,
    tipoDocumento: p.tipoDocumento,
    numeroDocumento: p.numeroDocumento,
    cuil: p.cuil || '',
    fechaNacimiento: p.fechaNacimiento?.slice(0, 10) || '',
    sexo: p.sexo || '',
    email: p.email || '',
    telefono: p.telefono || '',
    celular: p.celular || '',
    direccion: p.direccion || '',
    localidad: p.localidad || '',
    provincia: p.provincia || '',
    codigoPostal: p.codigoPostal || '',
    estadoCivilId: p.estadoCivilId || '',
  };
}

/** Strip empty strings so `""` never travels in optional fields (RN-17/F1.4). */
function identityToPersonaDto(data: IdentityData, administradoraId: string): CreatePersonaDto {
  const dto: CreatePersonaDto = {
    nombre: data.nombre.trim(),
    apellido: data.apellido.trim(),
    tipoDocumento: data.tipoDocumento,
    numeroDocumento: data.numeroDocumento.trim(),
    fechaNacimiento: data.fechaNacimiento,
    administradoraId,
    activo: true,
  };
  const opt: (keyof IdentityData)[] = [
    'cuil',
    'sexo',
    'email',
    'telefono',
    'celular',
    'direccion',
    'localidad',
    'provincia',
    'codigoPostal',
    'estadoCivilId',
  ];
  const dtoRecord = dto as unknown as Record<string, unknown>;
  for (const k of opt) {
    const v = (data[k] || '').toString().trim();
    if (v) dtoRecord[k] = v;
  }
  return dto;
}

interface DuplicateMatch {
  id: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

interface AfiliadoFormProps {
  /** null = alta; a Persona = edición del afiliado (titular). */
  persona?: Persona | null;
}

/**
 * All-in-one Afiliado form (UX-12b) — the classic afiliado+adherentes flow.
 *
 * Section 1: titular identity (full AR-validated identity fields).
 * Section 2: titular afiliación (obra social preset RN-14, N° afiliado, plan).
 * Section 3: adherentes inline — add several via a toggle sub-form (crear nuevo
 *   / seleccionar existente), each with parentesco; the pending list supports
 *   edit + remove before saving. Disabled until an obra social is chosen (the
 *   adherente vínculo requires the same OS as the titular — RN-07).
 *
 * Save is orchestrated with rollback (alta): create titular persona → titular
 * afiliación → for each new adherente {persona? → afiliación ADHERENTE → vínculo}.
 * If anything fails after the titular was created, the just-created titular
 * afiliación + persona are rolled back. In edición the changes are applied
 * incrementally (add new adherentes, remove unlinked ones) without total rollback.
 */
export default function AfiliadoForm({ persona = null }: AfiliadoFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const administradoraId = user?.administradoraId || persona?.administradoraId || '';
  const isEditing = !!persona;

  const formRef = useRef<HTMLDivElement>(null);

  // Section 1 — titular identity
  const [titular, setTitular] = useState<IdentityData>(() =>
    persona ? identityFromPersona(persona) : emptyTitular()
  );
  const [titularErrors, setTitularErrors] = useState<Record<string, string>>({});
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);

  // Section 2 — afiliación
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [administradora, setAdministradora] = useState<Administradora | null>(null);
  const [obraSocialId, setObraSocialId] = useState('');
  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [plan, setPlan] = useState('');
  const [afiliacionErrors, setAfiliacionErrors] = useState<Record<string, string>>({});
  // Edit-mode: the titular's existing active afiliación (to know we don't recreate it).
  const [titularAfiliacion, setTitularAfiliacion] = useState<Afiliacion | null>(null);

  // Section 3 — adherentes
  const [pendingAdherentes, setPendingAdherentes] = useState<PendingAdherente[]>([]);
  const [editingAdherente, setEditingAdherente] = useState<PendingAdherente | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  // Adherentes removed while editing (existing vínculos to soft-delete on save).
  const [removedVinculos, setRemovedVinculos] = useState<
    { afiliacionAdherenteId: string; vinculoId: string }[]
  >([]);

  // Titular duplicate check (UX-3.1)
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [duplicateIgnored, setDuplicateIgnored] = useState(false);
  const duplicateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duplicateRequestIdRef = useRef(0);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- Load catalogs + (edit) existing afiliación & adherentes ----
  useEffect(() => {
    estadoCivilService.getAll().then(setEstadosCiviles).catch(() => setEstadosCiviles([]));
    obrasSocialesService.getAll().then(setObrasSociales).catch(() => setObrasSociales([]));
    if (administradoraId) {
      administradoraService
        .getById(administradoraId)
        .then(setAdministradora)
        .catch(() => setAdministradora(null));
    }
  }, [administradoraId]);

  // Preset RN-14 (only in alta; edición loads the real afiliación below).
  useEffect(() => {
    if (!isEditing && administradora?.obraSocialPredeterminadaId && !obraSocialId) {
      setObraSocialId(administradora.obraSocialPredeterminadaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [administradora, isEditing]);

  const loadExisting = useCallback(async () => {
    if (!persona) return;
    try {
      const afs = await afiliacionesService.getAll({ personaId: persona.id });
      const titularAf = afs.find((a) => a.rol === 'TITULAR' && a.activo);
      if (titularAf) {
        setTitularAfiliacion(titularAf);
        setObraSocialId(titularAf.obraSocialId);
        setNumeroAfiliado(titularAf.numeroAfiliado || '');
        setPlan(titularAf.plan || '');
        const grupo = (await afiliacionesService.getGrupo(titularAf.id)) as GrupoTitular;
        const existing: PendingAdherente[] = (grupo.adherentes || []).map((item) => ({
          _key: `existing_${item.vinculoId}`,
          mode: 'existente',
          parentescoId: item.parentesco.id,
          parentescoNombre: item.parentesco.nombre,
          personaId: item.afiliacion.personaId,
          personaLabel: item.afiliacion.persona
            ? `${item.afiliacion.persona.apellido}, ${item.afiliacion.persona.nombre} — ${item.afiliacion.persona.tipoDocumento} ${item.afiliacion.persona.numeroDocumento}`
            : 'Adherente',
          existingVinculoId: item.vinculoId,
          existingAfiliacionAdherenteId: item.afiliacion.id,
        }));
        setPendingAdherentes(existing);
      }
    } catch (err) {
      notify.error('No se pudieron cargar los adherentes', extractErrorMessage(err));
    }
  }, [persona]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  // ---- Titular field wiring ----
  const setTitularField = <K extends keyof IdentityData>(key: K, value: IdentityData[K]) => {
    setTitular((prev) => ({ ...prev, [key]: value }));
  };

  const onBlurTitular = (field: keyof IdentityData) => {
    // Reuse identity validators inline (same rules as adherente sub-form).
    let msg: string | null = null;
    if (field === 'numeroDocumento' && titular.tipoDocumento === 'DNI' && titular.numeroDocumento) {
      msg = /^\d{7,8}$/.test(titular.numeroDocumento) ? null : 'El DNI debe tener 7 u 8 dígitos';
    } else if (field === 'cuil' && titular.cuil) {
      msg = /^\d{11}$/.test(titular.cuil) ? null : 'CUIL inválido (11 dígitos + verificador)';
    }
    setTitularErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else if (field !== 'numeroDocumento' && field !== 'cuil') return prev;
      else delete next[field];
      return next;
    });
  };

  const checkTitularDuplicate = () => {
    const numeroDocumento = titular.numeroDocumento;
    if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
    const requestId = ++duplicateRequestIdRef.current;
    if (numeroDocumento.trim().length < 7) {
      setDuplicateMatch(null);
      return;
    }
    duplicateTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await personasService.getPaginated({
          search: numeroDocumento.trim(),
          page: 1,
          limit: 5,
        });
        if (requestId !== duplicateRequestIdRef.current) return;
        const match = result.data.find(
          (p) =>
            p.numeroDocumento === numeroDocumento.trim() &&
            p.tipoDocumento === titular.tipoDocumento &&
            p.id !== persona?.id
        );
        setDuplicateMatch(
          match
            ? {
                id: match.id,
                nombre: match.nombre,
                apellido: match.apellido,
                tipoDocumento: match.tipoDocumento,
                numeroDocumento: match.numeroDocumento,
              }
            : null
        );
        setDuplicateIgnored(false);
      } catch {
        /* non-blocking */
      }
    }, 400);
  };

  // ---- Adherentes list ops ----
  const excludedPersonaIds = useMemo(() => {
    const ids = new Set<string>();
    if (persona?.id) ids.add(persona.id);
    for (const a of pendingAdherentes) {
      if (a.personaId) ids.add(a.personaId);
      // when editing the item currently in the sub-form, allow re-selecting it
    }
    if (editingAdherente?.personaId) ids.delete(editingAdherente.personaId);
    return Array.from(ids);
  }, [persona, pendingAdherentes, editingAdherente]);

  const pendingDocs = useMemo(
    () =>
      pendingAdherentes
        .filter((a) => a.mode === 'nuevo' && a.identity && a._key !== editingAdherente?._key)
        .map((a) => ({
          tipoDocumento: a.identity!.tipoDocumento as TipoDocumento,
          numeroDocumento: a.identity!.numeroDocumento,
        })),
    [pendingAdherentes, editingAdherente]
  );

  const handleAddAdherente = (adh: PendingAdherente) => {
    setPendingAdherentes((prev) => {
      const idx = prev.findIndex((a) => a._key === adh._key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = adh;
        return copy;
      }
      return [...prev, adh];
    });
    setEditingAdherente(null);
    setShowSubForm(false);
  };

  const handleEditAdherente = (adh: PendingAdherente) => {
    setEditingAdherente(adh);
    setShowSubForm(true);
  };

  const handleRemoveAdherente = (adh: PendingAdherente) => {
    setPendingAdherentes((prev) => prev.filter((a) => a._key !== adh._key));
    // If it was an already-linked adherente (edit mode), schedule vínculo removal.
    if (adh.existingVinculoId && adh.existingAfiliacionAdherenteId) {
      setRemovedVinculos((prev) => [
        ...prev,
        { afiliacionAdherenteId: adh.existingAfiliacionAdherenteId!, vinculoId: adh.existingVinculoId! },
      ]);
    }
    if (editingAdherente?._key === adh._key) {
      setEditingAdherente(null);
      setShowSubForm(false);
    }
  };

  const orderedObrasSociales = user?.id
    ? sortByFrequency(obrasSociales, OBRA_SOCIAL_FREQUENCY_NS, user.id, (o) => o.id)
    : obrasSociales;

  const estadoCivilOptions = estadosCiviles.map((e) => ({ value: e.id, label: e.nombre }));

  // ---- Save orchestration ----
  const validateBeforeSave = (): boolean => {
    const tErrors = { ...titularErrors };
    // Full titular validation
    if (!titular.nombre.trim()) tErrors.nombre = 'Requerido';
    if (!titular.apellido.trim()) tErrors.apellido = 'Requerido';
    if (!titular.numeroDocumento.trim()) tErrors.numeroDocumento = 'Requerido';
    else if (titular.tipoDocumento === 'DNI' && !/^\d{7,8}$/.test(titular.numeroDocumento)) {
      tErrors.numeroDocumento = 'El DNI debe tener 7 u 8 dígitos';
    }
    if (!titular.fechaNacimiento) tErrors.fechaNacimiento = 'Requerido';
    setTitularErrors(tErrors);

    const aErrors: Record<string, string> = {};
    // If there are adherentes pending, obra social is mandatory (vínculo needs it).
    if (pendingAdherentes.some((a) => !a.existingVinculoId) && !obraSocialId) {
      aErrors.obraSocialId = 'Necesaria para agregar adherentes';
    }
    setAfiliacionErrors(aErrors);

    return Object.keys(tErrors).length === 0 && Object.keys(aErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validateBeforeSave()) {
      focusFirstError({ ...titularErrors, ...afiliacionErrors });
      return;
    }

    setSaving(true);
    // Rollback ledger (alta only).
    let createdTitularPersonaId: string | null = null;
    let createdTitularAfiliacionId: string | null = null;
    const createdAdherentePersonaIds: string[] = [];
    const createdAdherenteAfiliacionIds: string[] = [];

    try {
      // ---- 1. Titular persona ----
      let titularPersona: Persona;
      if (isEditing && persona) {
        titularPersona = await personasService.update(
          persona.id,
          identityToPersonaDto(titular, administradoraId)
        );
      } else {
        titularPersona = await personasService.create(identityToPersonaDto(titular, administradoraId));
        createdTitularPersonaId = titularPersona.id;
      }

      // ---- 2. Titular afiliación (only if an obra social was chosen) ----
      let titularAfiliacionId = titularAfiliacion?.id || null;
      if (obraSocialId) {
        if (isEditing && titularAfiliacion) {
          // Update N° afiliado / plan on the existing titular afiliación.
          await afiliacionesService.update(titularAfiliacion.id, {
            numeroAfiliado: numeroAfiliado || undefined,
            plan: plan || undefined,
          });
          titularAfiliacionId = titularAfiliacion.id;
        } else if (!titularAfiliacionId) {
          const created = await afiliacionesService.create({
            personaId: titularPersona.id,
            obraSocialId,
            rol: 'TITULAR',
            numeroAfiliado: numeroAfiliado || undefined,
            plan: plan || undefined,
            administradoraId,
          } as CreateAfiliacionDto);
          titularAfiliacionId = created.id;
          createdTitularAfiliacionId = created.id;
          if (user?.id) bumpFrequency(OBRA_SOCIAL_FREQUENCY_NS, user.id, obraSocialId);
        }
      }

      // ---- 3. Adherentes ----
      let alerta80Count = 0;
      let skippedDuplicates = 0;

      // 3a. Removed (edit mode): soft-delete their vínculos.
      for (const rem of removedVinculos) {
        try {
          await afiliacionesService.deleteVinculo(rem.afiliacionAdherenteId, rem.vinculoId);
        } catch (err) {
          notify.error('No se pudo quitar un adherente', extractErrorMessage(err));
        }
      }

      // 3b. New adherentes (skip ones already linked from edit load).
      const nuevos = pendingAdherentes.filter((a) => !a.existingVinculoId);
      for (const adh of nuevos) {
        if (!titularAfiliacionId) break; // no OS → cannot link (guarded above)

        try {
          // (a) resolve the adherente persona id
          let adherentePersonaId = adh.personaId || '';
          if (adh.mode === 'nuevo' && adh.identity) {
            try {
              const created = await personasService.create(
                identityToPersonaDto(adh.identity, administradoraId)
              );
              adherentePersonaId = created.id;
              createdAdherentePersonaIds.push(created.id);
            } catch (err) {
              const status = (err as { response?: { status?: number } })?.response?.status;
              if (status === 409) {
                skippedDuplicates += 1;
                notify.error(
                  `Adherente omitido: ${adh.identity.apellido}, ${adh.identity.nombre}`,
                  'Ya existe una persona con ese documento. Cargalo como "Seleccionar existente".'
                );
                continue; // skip THIS adherente, keep going
              }
              throw err;
            }
          }

          // (b) heredar domicilio (existing persona, explicit opt-in)
          if (adh.mode === 'existente' && adh.heredarDomicilio && adherentePersonaId) {
            try {
              await personasService.update(adherentePersonaId, {
                direccion: titular.direccion || undefined,
                localidad: titular.localidad || undefined,
                provincia: titular.provincia || undefined,
                codigoPostal: titular.codigoPostal || undefined,
              });
            } catch {
              /* domicilio inheritance is best-effort, never blocks the link */
            }
          }

          // (c) find or create the ADHERENTE afiliación in the titular's OS
          let afiliacionAdherenteId = '';
          const existentes = await afiliacionesService.getAll({
            personaId: adherentePersonaId,
            obraSocialId,
          });
          const activa = existentes.find((a) => a.activo);
          if (activa) {
            afiliacionAdherenteId = activa.id;
          } else {
            const nuevaAf = await afiliacionesService.create({
              personaId: adherentePersonaId,
              obraSocialId,
              rol: 'ADHERENTE',
              administradoraId,
            } as CreateAfiliacionDto);
            afiliacionAdherenteId = nuevaAf.id;
            createdAdherenteAfiliacionIds.push(nuevaAf.id);
          }

          // (d) create the vínculo
          const vinculo = await afiliacionesService.createVinculo(afiliacionAdherenteId, {
            afiliacionTitularId: titularAfiliacionId,
            parentescoId: adh.parentescoId,
          });

          // alerta 80 (RN-08): amber, non-blocking — surface as a toast.
          try {
            const alertas = await alertasService.getAlertasByPersona(adherentePersonaId);
            if (alertas.some((a) => a.codigoAlerta?.codigo === 80 && a.entidadOrigenId === vinculo.id)) {
              alerta80Count += 1;
            }
          } catch {
            /* ignore alert lookup failures */
          }
        } catch (err) {
          // A hard failure creating an adherente/vínculo → rollback everything (alta).
          throw err;
        }
      }

      // ---- Success feedback ----
      const totalAdh = pendingAdherentes.length;
      if (isEditing) {
        notify.success('Afiliado actualizado', `${totalAdh} adherente${totalAdh === 1 ? '' : 's'}.`);
      } else {
        const added = nuevos.length - skippedDuplicates;
        notify.success(
          'Afiliado creado',
          `${added} adherente${added === 1 ? '' : 's'} agregado${added === 1 ? '' : 's'}.`
        );
      }
      if (alerta80Count > 0) {
        notify.info(
          'Atención',
          `${alerta80Count} adherente${alerta80Count === 1 ? '' : 's'} ya tenía${
            alerta80Count === 1 ? '' : 'n'
          } otro vínculo activo (alerta 80).`
        );
      }

      router.push(`/dashboard/afiliados/${titularPersona.id}`);
    } catch (error) {
      // ---- Rollback (alta only): undo created afiliaciones + personas ----
      if (!isEditing) {
        for (const id of createdAdherenteAfiliacionIds) {
          try {
            await afiliacionesService.delete(id);
          } catch {
            /* best-effort */
          }
        }
        for (const id of createdAdherentePersonaIds) {
          try {
            await personasService.delete(id);
          } catch {
            /* best-effort */
          }
        }
        if (createdTitularAfiliacionId) {
          try {
            await afiliacionesService.delete(createdTitularAfiliacionId);
          } catch {
            /* best-effort */
          }
        }
        if (createdTitularPersonaId) {
          try {
            await personasService.delete(createdTitularPersonaId);
          } catch {
            /* best-effort */
          }
        }
      }

      const conflict =
        (error as { response?: { status?: number } })?.response?.status === 409;
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, [
        'nombre',
        'apellido',
        'numeroDocumento',
        'fechaNacimiento',
        'email',
      ]);
      if (Object.keys(fe).length > 0) setTitularErrors((prev) => ({ ...prev, ...fe }));
      if (conflict && !fe.numeroDocumento) {
        setTitularErrors((prev) => ({
          ...prev,
          numeroDocumento: 'Ya existe una persona con ese documento',
        }));
        setFormError('El titular ya existe con ese documento. Revisá el número.');
      } else {
        setFormError(
          gf ||
            (isEditing
              ? 'No se pudo actualizar el afiliado.'
              : 'No se pudo crear el afiliado. Se revirtieron los cambios.')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const isDirty = true; // page-level form: Esc/leave always confirms.
  const { onKeyDown, focusFirstError } = useFormKeyboard({
    formRef,
    onSubmit: handleSubmit,
    onClose: () => router.push('/dashboard/afiliados'),
    isDirty,
    autofocus: false,
  });

  const adherentesDisabled = !obraSocialId;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg)]">
            {isEditing ? 'Editar afiliado' : 'Nuevo afiliado'}
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Datos del titular, su afiliación y los adherentes a cargo.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/afiliados')} disabled={saving}>
          Volver
        </Button>
      </div>

      <div ref={formRef} onKeyDown={onKeyDown} className="space-y-6">
        {/* SECTION 1 — Titular */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <UserRound className="size-4 text-[var(--primary-600)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--fg)]">
              Datos del titular
            </h2>
          </div>

          <IdentityFields
            data={titular}
            errors={titularErrors}
            namePrefix="titular"
            setField={setTitularField}
            onBlurField={onBlurTitular}
            showEstadoCivil
            estadoCivilOptions={estadoCivilOptions}
            onDocumentoBlur={checkTitularDuplicate}
            afterDocumento={
              duplicateMatch && !duplicateIgnored ? (
                <div className="flex items-start gap-2 rounded-md border border-[var(--sev-media)] bg-[var(--sev-media-bg)] px-3 py-2 text-sm text-[var(--sev-media-fg)]">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <p>
                      Ya existe:{' '}
                      <strong>
                        {duplicateMatch.apellido}, {duplicateMatch.nombre}
                      </strong>{' '}
                      — {duplicateMatch.tipoDocumento} {duplicateMatch.numeroDocumento}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/afiliados/${duplicateMatch.id}`}
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
              ) : null
            }
          />
        </section>

        {/* SECTION 2 — Afiliación */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Users className="size-4 text-[var(--primary-600)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--fg)]">
              Afiliación del titular
            </h2>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--fg-muted)]">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            La obra social es necesaria para agregar adherentes (el adherente se vincula dentro de la
            obra social del titular).
          </div>

          <Field label="Obra social" error={afiliacionErrors.obraSocialId}>
            <SearchableSelect
              options={orderedObrasSociales.map((o) => ({ value: o.id, label: o.nombre }))}
              value={obraSocialId}
              onChange={(v) => {
                setObraSocialId(v);
                setAfiliacionErrors((prev) => {
                  const next = { ...prev };
                  delete next.obraSocialId;
                  return next;
                });
              }}
              placeholder="Seleccionar obra social"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="N° de afiliado">
              <Input
                name="numeroAfiliado"
                value={numeroAfiliado}
                onChange={(e) => setNumeroAfiliado(e.target.value)}
                className="tabular-nums"
                autoComplete="off"
                placeholder="Texto libre"
              />
            </Field>
            <Field label="Plan">
              <Input
                name="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                autoComplete="off"
              />
            </Field>
          </div>
        </section>

        {/* SECTION 3 — Adherentes */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[var(--primary-600)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--fg)]">
                Adherentes
                {pendingAdherentes.length > 0 && (
                  <span className="ml-2 rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-xs font-medium text-[var(--primary-700)]">
                    {pendingAdherentes.length}
                  </span>
                )}
              </h2>
            </div>
            {!adherentesDisabled && !showSubForm && (
              <Button
                size="sm"
                variant="subtle"
                onClick={() => {
                  setEditingAdherente(null);
                  setShowSubForm(true);
                }}
              >
                Agregar adherente
              </Button>
            )}
          </div>

          {adherentesDisabled ? (
            <div className="flex items-start gap-2 rounded-md border border-dashed border-[var(--border-strong)] px-3 py-4 text-sm text-[var(--fg-muted)]">
              <Info className="mt-0.5 size-4 shrink-0" />
              Elegí una obra social arriba para poder agregar adherentes.
            </div>
          ) : (
            <>
              {/* Pending list */}
              {pendingAdherentes.length > 0 && (
                <ul className="space-y-2">
                  {pendingAdherentes.map((adh) => (
                    <li
                      key={adh._key}
                      className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--fg)]">
                          {adh.mode === 'nuevo' && adh.identity
                            ? `${adh.identity.apellido}, ${adh.identity.nombre}`
                            : adh.personaLabel}
                        </p>
                        <p className="text-xs text-[var(--fg-muted)]">
                          <span className="tabular-nums">
                            {adh.mode === 'nuevo' && adh.identity
                              ? `${adh.identity.tipoDocumento} ${adh.identity.numeroDocumento}`
                              : ''}
                          </span>
                          {adh.parentescoNombre && (
                            <span className="ml-1 rounded bg-[var(--surface)] px-1.5 py-0.5">
                              {adh.parentescoNombre}
                            </span>
                          )}
                          {adh.existingVinculoId && (
                            <span className="ml-1 text-[var(--fg-subtle)]">· ya vinculado</span>
                          )}
                          {adh.mode === 'nuevo' && (
                            <span className="ml-1 text-[var(--primary-700)]">· nuevo</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditAdherente(adh)}
                          className="rounded-md p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]"
                          title="Editar adherente"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdherente(adh)}
                          className="rounded-md p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--sev-critica-bg)] hover:text-[var(--sev-critica-fg)]"
                          title="Quitar adherente"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Sub-form */}
              {showSubForm ? (
                <AdherenteSubForm
                  key={editingAdherente?._key || 'nuevo-adherente'}
                  excludedPersonaIds={excludedPersonaIds}
                  pendingDocs={pendingDocs}
                  titularDireccion={titular.direccion}
                  titularLocalidad={titular.localidad}
                  editing={editingAdherente}
                  onAdd={handleAddAdherente}
                  onCancelEdit={() => {
                    setEditingAdherente(null);
                    setShowSubForm(false);
                  }}
                />
              ) : (
                pendingAdherentes.length === 0 && (
                  <p className="rounded-md border border-dashed border-[var(--border-strong)] px-3 py-4 text-center text-sm text-[var(--fg-subtle)]">
                    Sin adherentes. Usá “Agregar adherente”.
                  </p>
                )
              )}
            </>
          )}
        </section>

        {formError && (
          <div className="rounded-md border border-[var(--sev-critica)] bg-[var(--sev-critica-bg)] px-3 py-2 text-sm text-[var(--sev-critica-fg)]">
            {formError}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/afiliados')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear afiliado'}
          </Button>
        </div>
      </div>
    </div>
  );
}
