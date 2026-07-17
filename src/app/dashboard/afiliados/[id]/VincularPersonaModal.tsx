'use client';

import { useEffect, useRef, useState } from 'react';
import { Afiliacion, AfiliacionVinculo, Parentesco, Persona } from '@/types';
import { personasService } from '@/services/personasService';
import { afiliacionesService } from '@/services/afiliacionesService';
import { parentescosService } from '@/services/parentescosService';
import { mapServerErrors } from '@/lib/errorUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableSelectRemote from '@/components/SearchableSelectRemote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home } from 'lucide-react';

interface VincularPersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Afiliación TITULAR sobre la que se arma el grupo. */
  afiliacionTitular: Afiliacion;
  /**
   * `personaVinculadaId` se pasa explícito (no se infiere de `vinculo`): el
   * backend guarda el vínculo sin popular relations en la respuesta de
   * `createVinculo`, así que `vinculo.afiliacionAdherente` puede venir
   * `undefined` — el modal ya sabe qué persona vinculó, se lo pasamos directo
   * al caller para que pueda refrescar SUS alertas (donde vive la 80).
   */
  onVinculado: (vinculo: AfiliacionVinculo, personaVinculadaId: string) => void;
}

/**
 * Modal "Vincular persona a cargo" (F2.4 sección 3, rol TITULAR). Busca la
 * persona con SearchableSelectRemote (búsqueda universal, bloque 39). Si la
 * persona elegida NO tiene afiliación activa en la MISMA obra social del
 * titular, ofrece un sub-paso inline para crearla como ADHERENTE (N° afiliado
 * opcional) antes de vincular — resuelve "cargar solo una vez" (bloque 45).
 *
 * UX-3.2 — heredar domicilio: si la persona elegida no tiene domicilio y el
 * titular sí, aparece un chip "[Usar domicilio del titular]" que lo copia
 * (update de la persona) SOLO al confirmar (regla madre: nunca se autocompleta).
 */
export default function VincularPersonaModal({
  open,
  onOpenChange,
  afiliacionTitular,
  onVinculado,
}: VincularPersonaModalProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const [personaId, setPersonaId] = useState('');
  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null);
  const [parentescoId, setParentescoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [parentescos, setParentescos] = useState<Parentesco[]>([]);

  const [afiliacionAdherenteExistente, setAfiliacionAdherenteExistente] = useState<Afiliacion | null>(null);
  const [checkingAfiliacion, setCheckingAfiliacion] = useState(false);
  const [numeroAfiliadoNuevo, setNumeroAfiliadoNuevo] = useState('');
  const [heredarDomicilio, setHeredarDomicilio] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    parentescosService.getAll().then(setParentescos).catch(() => setParentescos([]));
  }, [open]);

  useEffect(() => {
    if (open) {
      setPersonaId('');
      setPersonaSeleccionada(null);
      setParentescoId('');
      setObservaciones('');
      setAfiliacionAdherenteExistente(null);
      setNumeroAfiliadoNuevo('');
      setHeredarDomicilio(false);
      setFieldErrors({});
      setFormError(null);
    }
  }, [open]);

  const isDirty = !!personaId || !!parentescoId;

  const fetcher = async (search: string) => {
    const result = await personasService.getPaginated({ search, page: 1, limit: 20 });
    return result.data
      .filter((p) => p.id !== afiliacionTitular.personaId)
      .map((p) => ({
        value: p.id,
        label: `${p.apellido}, ${p.nombre} — ${p.tipoDocumento} ${p.numeroDocumento}`,
      }));
  };

  // Al elegir persona, chequear si ya tiene afiliación activa en la MISMA
  // obra social del titular (RN-07: el vínculo exige misma OS en ambos lados).
  const handleSelectPersona = async (id: string) => {
    setPersonaId(id);
    setAfiliacionAdherenteExistente(null);
    setPersonaSeleccionada(null);
    setNumeroAfiliadoNuevo('');
    if (!id) return;

    setCheckingAfiliacion(true);
    try {
      const [persona, afiliaciones] = await Promise.all([
        personasService.getById(id),
        afiliacionesService.getAll({ personaId: id, obraSocialId: afiliacionTitular.obraSocialId }),
      ]);
      setPersonaSeleccionada(persona);
      const activa = afiliaciones.find((a) => a.activo);
      setAfiliacionAdherenteExistente(activa || null);
    } catch {
      /* si falla el chequeo, se resuelve igual al confirmar (el backend valida) */
    } finally {
      setCheckingAfiliacion(false);
    }
  };

  const puedeHeredarDomicilio =
    !!personaSeleccionada &&
    !personaSeleccionada.direccion &&
    !!afiliacionTitular.persona?.direccion;

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!personaId) errors.personaId = 'Requerido';
    if (!parentescoId) errors.parentescoId = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    try {
      setSaving(true);

      // UX-3.2 — heredar domicilio: acción explícita, se aplica recién acá
      // (al confirmar el submit), nunca antes.
      if (heredarDomicilio && puedeHeredarDomicilio && personaSeleccionada) {
        await personasService.update(personaSeleccionada.id, {
          direccion: afiliacionTitular.persona?.direccion,
          localidad: afiliacionTitular.persona?.localidad,
          provincia: afiliacionTitular.persona?.provincia,
          codigoPostal: afiliacionTitular.persona?.codigoPostal,
        });
      }

      let afiliacionAdherenteId = afiliacionAdherenteExistente?.id;

      if (!afiliacionAdherenteId) {
        // Sub-paso inline: crear la afiliación ADHERENTE en la misma OS antes de vincular.
        const nuevaAfiliacion = await afiliacionesService.create({
          personaId,
          obraSocialId: afiliacionTitular.obraSocialId,
          rol: 'ADHERENTE',
          numeroAfiliado: numeroAfiliadoNuevo || undefined,
          administradoraId: afiliacionTitular.administradoraId,
        });
        afiliacionAdherenteId = nuevaAfiliacion.id;
      }

      const vinculo = await afiliacionesService.createVinculo(afiliacionAdherenteId, {
        afiliacionTitularId: afiliacionTitular.id,
        parentescoId,
        observaciones: observaciones || undefined,
      });

      onVinculado(vinculo, personaId);
      onOpenChange(false);
    } catch (error) {
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, ['personaId', 'parentescoId', 'observaciones']);
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (gf) setFormError(gf);
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
          <DialogTitle>Agregar adherente</DialogTitle>
          <DialogDescription>
            Vinculá una persona ya cargada como adherente del grupo familiar de{' '}
            {afiliacionTitular.persona?.apellido}, {afiliacionTitular.persona?.nombre} en{' '}
            {afiliacionTitular.obraSocial?.nombre}. Si la persona todavía no está en el sistema, cargala desde
            Editar afiliado → Adherentes.
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
              Persona <span className="text-[var(--sev-critica)]">*</span>
            </label>
            <SearchableSelectRemote
              value={personaId}
              onChange={handleSelectPersona}
              fetcher={fetcher}
              placeholder="Buscar por nombre, apellido, documento o CUIL/CUIT…"
            />
            {fieldErrors.personaId && (
              <p className="mt-1 text-xs text-[var(--sev-critica-fg)]">{fieldErrors.personaId}</p>
            )}
          </div>

          {checkingAfiliacion && (
            <p className="text-xs text-[var(--fg-subtle)]">Verificando afiliación existente…</p>
          )}

          {personaSeleccionada && !checkingAfiliacion && !afiliacionAdherenteExistente && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-sm text-[var(--fg-muted)]">
              Esta persona no tiene afiliación en {afiliacionTitular.obraSocial?.nombre}. Se creará como{' '}
              <strong>ADHERENTE</strong> al vincular.
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-[var(--fg)]">N° afiliado (opcional)</label>
                <Input
                  value={numeroAfiliadoNuevo}
                  onChange={(e) => setNumeroAfiliadoNuevo(e.target.value)}
                  className="tabular-nums"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* UX-3.2 — chip heredar domicilio, click explícito */}
          {puedeHeredarDomicilio && (
            <label className="flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--fg-muted)]">
              <input
                type="checkbox"
                checked={heredarDomicilio}
                onChange={(e) => setHeredarDomicilio(e.target.checked)}
                className="size-4 rounded border-[var(--border-strong)]"
              />
              <Home className="size-3.5 shrink-0" />
              Usar domicilio del titular: {afiliacionTitular.persona?.direccion}
              {afiliacionTitular.persona?.localidad ? `, ${afiliacionTitular.persona.localidad}` : ''}
            </label>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--fg)]">
              Parentesco <span className="text-[var(--sev-critica)]">*</span>
            </label>
            <SearchableSelect
              options={parentescos.map((p) => ({ value: p.id, label: p.nombre }))}
              value={parentescoId}
              onChange={setParentescoId}
              placeholder="Seleccionar parentesco"
            />
            {fieldErrors.parentescoId && (
              <p className="mt-1 text-xs text-[var(--sev-critica-fg)]">{fieldErrors.parentescoId}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--fg)]">Observaciones</label>
            <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} autoComplete="off" />
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
