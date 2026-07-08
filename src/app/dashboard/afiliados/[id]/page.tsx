'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Users,
  FileText,
  Bell as BellIcon,
  AlertTriangle,
} from 'lucide-react';

import {
  Persona,
  Afiliacion,
  AfiliacionVinculo,
  PersonaProfesional,
  Alerta,
  CertificadoDiscapacidad,
} from '@/types';
import { personasService } from '@/services/personasService';
import { afiliacionesService } from '@/services/afiliacionesService';
import { alertasService } from '@/services/alertasService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { notify } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { calcularEdad } from '@/lib/age';
import { priorityToTone, TONE_VARS } from '@/lib/severity';
import { timeAgo } from '@/lib/timeAgo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import AfiliacionFormModal from './AfiliacionFormModal';
import VincularPersonaModal from './VincularPersonaModal';
import VincularProfesionalModal from './VincularProfesionalModal';

/** Shape exacto de GET /afiliaciones/:id/grupo — ver afiliaciones.service.ts#getGrupo (backend). */
type GrupoTitular = {
  titular: Afiliacion;
  adherentes: { vinculoId: string; parentesco: { id: string; nombre: string }; afiliacion: Afiliacion }[];
};
type GrupoAdherente = {
  adherente: Afiliacion;
  titulares: { vinculoId: string; parentesco: { id: string; nombre: string }; afiliacion: Afiliacion }[];
};

export default function AfiliadoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const confirm = useConfirm();
  const personaId = params.id as string;

  const [persona, setPersona] = useState<Persona | null>(null);
  const [afiliaciones, setAfiliaciones] = useState<Afiliacion[]>([]);
  const [grupos, setGrupos] = useState<Record<string, GrupoTitular | GrupoAdherente>>({});
  const [terceros, setTerceros] = useState<PersonaProfesional[]>([]);
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [afiliacionModalOpen, setAfiliacionModalOpen] = useState(false);
  const [vincularModalOpen, setVincularModalOpen] = useState(false);
  const [afiliacionParaVincular, setAfiliacionParaVincular] = useState<Afiliacion | null>(null);
  const [vincularProfesionalModalOpen, setVincularProfesionalModalOpen] = useState(false);

  // Alerta 80 (RN-08): banner ámbar no bloqueante tras un vínculo exitoso.
  const [alerta80Banner, setAlerta80Banner] = useState<Alerta | null>(null);

  const loadPersona = useCallback(async () => {
    const p = await personasService.getById(personaId);
    setPersona(p);
    return p;
  }, [personaId]);

  const loadAfiliaciones = useCallback(async () => {
    const afs = await afiliacionesService.getAll({ personaId });
    const activas = afs.filter((a) => a.activo);
    setAfiliaciones(activas);

    const gruposEntries = await Promise.all(
      activas.map(async (a) => {
        const grupo = await afiliacionesService.getGrupo(a.id);
        return [a.id, grupo as GrupoTitular | GrupoAdherente] as const;
      })
    );
    setGrupos(Object.fromEntries(gruposEntries));
  }, [personaId]);

  /** Terceros vinculados (UX-17): a nivel PERSONA — no depende de afiliaciones/obra social. */
  const loadTerceros = useCallback(async () => {
    try {
      const links = await personasService.getTercerosVinculados(personaId);
      setTerceros(links);
    } catch {
      setTerceros([]);
    }
  }, [personaId]);

  const loadCertificados = useCallback(async () => {
    // B-5.1: filtro server-side por personaId (ver certificadosDiscapacidadService.ts).
    const filtrados = await certificadosDiscapacidadService.getAll({ personaId });
    setCertificados(filtrados);
  }, [personaId]);

  const loadAlertas = useCallback(async () => {
    const list = await alertasService.getAlertasByPersona(personaId);
    setAlertas(list);
    return list;
  }, [personaId]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadPersona(), loadAfiliaciones(), loadCertificados(), loadAlertas(), loadTerceros()]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadPersona, loadAfiliaciones, loadCertificados, loadAlertas, loadTerceros]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /** Tras crear un vínculo: refresca afiliaciones/grupos y chequea alerta 80 sobre la persona vinculada. */
  const handleVinculoCreado = async (vinculo: AfiliacionVinculo, personaVinculadaId: string) => {
    await loadAfiliaciones();
    try {
      const alertasPersonaVinculada = await alertasService.getAlertasByPersona(personaVinculadaId);
      const alerta80 = alertasPersonaVinculada.find(
        (a) => a.codigoAlerta?.codigo === 80 && a.entidadOrigenId === vinculo.id
      );
      if (alerta80) {
        setAlerta80Banner(alerta80);
      }
      if (personaVinculadaId === personaId) {
        setAlertas(alertasPersonaVinculada);
      }
    } catch {
      /* no bloquea la UI si falla el refresh de alertas */
    }
  };

  const handleEliminarAfiliado = async () => {
    const ok = await confirm({
      title: 'Eliminar afiliado',
      description: `Se dará de baja a ${persona?.apellido}, ${persona?.nombre} junto con sus afiliaciones. Se puede reactivar más adelante. ¿Continuar?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await personasService.delete(personaId);
      notify.success('Afiliado eliminado');
      router.push('/dashboard/afiliados');
    } catch (err) {
      notify.error('No se pudo eliminar el afiliado', extractErrorMessage(err));
    }
  };

  const handleEliminarAfiliacion = async (afiliacion: Afiliacion) => {
    const ok = await confirm({
      title: 'Eliminar afiliación',
      description: `Se eliminará la afiliación con ${afiliacion.obraSocial?.nombre ?? 'la obra social'}. ¿Querés continuar?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await afiliacionesService.delete(afiliacion.id);
      await loadAfiliaciones();
      notify.success('Afiliación eliminada');
    } catch (err) {
      notify.error('No se pudo eliminar la afiliación', extractErrorMessage(err));
    }
  };

  const handleEliminarVinculo = async (afiliacionId: string, vinculoId: string) => {
    const ok = await confirm({
      title: 'Quitar adherente',
      description: 'Se quitará el adherente de este afiliado. ¿Querés continuar?',
      confirmLabel: 'Quitar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await afiliacionesService.deleteVinculo(afiliacionId, vinculoId);
      await loadAfiliaciones();
      notify.success('Adherente quitado');
    } catch (err) {
      notify.error('No se pudo eliminar el vínculo', extractErrorMessage(err));
    }
  };

  const handleEliminarTerceroVinculado = async (linkId: string) => {
    const ok = await confirm({
      title: 'Quitar tercero vinculado',
      description: 'Se quitará el vínculo con este profesional. ¿Querés continuar?',
      confirmLabel: 'Quitar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await personasService.unlinkTerceroVinculado(personaId, linkId);
      await loadTerceros();
      notify.success('Tercero vinculado quitado');
    } catch (err) {
      notify.error('No se pudo quitar el tercero vinculado', extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <span className="skeleton block h-8 w-64 rounded" />
        <span className="skeleton block h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="rounded-md border border-[var(--sev-critica)] bg-[var(--sev-critica-bg)] px-4 py-3 text-sm text-[var(--sev-critica-fg)]">
        {error || 'Afiliado no encontrado.'}
      </div>
    );
  }

  const edad = calcularEdad(persona.fechaNacimiento);

  return (
    <div className="space-y-6 pb-10">
      <button
        onClick={() => router.push('/dashboard/afiliados')}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft className="size-4" />
        Volver a Afiliados
      </button>

      {/* Alerta 80 — banner ámbar no bloqueante */}
      {alerta80Banner && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-[var(--sev-media)] bg-[var(--sev-media-bg)] px-4 py-3 text-sm text-[var(--sev-media-fg)]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>Vinculado. Atención: {alerta80Banner.mensaje}</span>
          </div>
          <button onClick={() => setAlerta80Banner(null)} className="shrink-0 text-xs font-medium underline">
            Cerrar
          </button>
        </div>
      )}

      {/* 1. Datos personales */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--fg)]">
              {persona.apellido}, {persona.nombre}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--fg-muted)]">
              <span className="tabular-nums">
                {persona.tipoDocumento} {persona.numeroDocumento}
              </span>
              <span className="text-[var(--fg-subtle)]">·</span>
              <span className="tabular-nums">{edad} años</span>
              {persona.sexo && (
                <>
                  <span className="text-[var(--fg-subtle)]">·</span>
                  <span>{persona.sexo}</span>
                </>
              )}
              <Badge variant={persona.activo ? 'baja' : 'secondary'}>
                {persona.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {afiliaciones.length === 0 ? (
                <Badge variant="secondary">Particular</Badge>
              ) : (
                afiliaciones.map((a) => (
                  <Badge key={a.id} variant="outline" title={a.obraSocial?.nombre}>
                    {a.obraSocial?.sigla || a.obraSocial?.nombre}·{a.rol === 'TITULAR' ? 'T' : 'A'}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/afiliados/${personaId}/editar`)}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleEliminarAfiliado}
              className="text-[var(--sev-critica-fg)] hover:bg-[var(--sev-critica-bg)]"
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-3">
          <InfoItem label="Email" value={persona.email} />
          <InfoItem label="Teléfono" value={persona.telefono} tabular />
          <InfoItem label="Celular" value={persona.celular} tabular />
          <InfoItem label="Dirección" value={persona.direccion} />
          <InfoItem label="Localidad" value={persona.localidad} />
          <InfoItem label="Provincia" value={persona.provincia} />
          <InfoItem label="Código postal" value={persona.codigoPostal} tabular />
          <InfoItem label="Estado civil" value={persona.estadoCivil?.nombre} />
          <InfoItem label="CUIL" value={persona.cuil} tabular />
        </dl>
      </section>

      {/* 2 y 3. Afiliaciones + adherentes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--fg)]">Afiliaciones</h2>
          <Button size="sm" onClick={() => setAfiliacionModalOpen(true)}>
            <Plus className="size-4" />
            Agregar afiliación
          </Button>
        </div>

        {afiliaciones.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-sm text-[var(--fg-muted)]">
            Sin afiliaciones. Este afiliado es particular.
          </p>
        ) : (
          <div className="space-y-3">
            {afiliaciones.map((afiliacion) => (
              <AfiliacionCard
                key={afiliacion.id}
                afiliacion={afiliacion}
                grupo={grupos[afiliacion.id]}
                onEliminar={() => handleEliminarAfiliacion(afiliacion)}
                onVincular={() => {
                  setAfiliacionParaVincular(afiliacion);
                  setVincularModalOpen(true);
                }}
                onEliminarVinculo={handleEliminarVinculo}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Terceros Vinculados (persona) — UX-17: no depende de obra social */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--fg)]">Terceros Vinculados</h2>
          <Button size="sm" onClick={() => setVincularProfesionalModalOpen(true)}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
        {terceros.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-sm text-[var(--fg-muted)]">
            Sin terceros vinculados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <ul className="divide-y divide-[var(--border)]">
              {terceros.map((link) => (
                <li key={link.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--fg)]">
                      {link.profesional?.apellido}, {link.profesional?.nombre}
                    </p>
                    {link.profesional && (
                      <p className="text-xs text-[var(--fg-muted)] tabular-nums">
                        Mat. {link.profesional.matricula}
                        {link.profesional.especialidad ? ` · ${link.profesional.especialidad}` : ''}
                      </p>
                    )}
                    {link.observaciones && (
                      <p className="mt-0.5 text-xs text-[var(--fg-subtle)]">{link.observaciones}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEliminarTerceroVinculado(link.id)}
                    className="shrink-0 text-xs text-[var(--fg-subtle)] hover:text-[var(--sev-critica-fg)]"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 5. Certificados CUD */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--fg)]">Certificados CUD</h2>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/certificados-discapacidad?personaId=${personaId}`}>
              <FileText className="size-4" />
              Cargar certificado
            </Link>
          </Button>
        </div>
        {certificados.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-sm text-[var(--fg-muted)]">
            Sin certificados cargados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <ul className="divide-y divide-[var(--border)]">
              {certificados.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-[var(--fg)] tabular-nums">{c.numeroCertificado}</p>
                    <p className="text-xs text-[var(--fg-muted)]">
                      Grado {c.grado} · Emitido {c.fechaEmision?.slice(0, 10)}
                      {c.fechaVencimiento ? ` · Vence ${c.fechaVencimiento.slice(0, 10)}` : ''}
                    </p>
                  </div>
                  <Badge variant={c.activo ? 'baja' : 'secondary'}>{c.activo ? 'Vigente' : 'Inactivo'}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 6. Alertas de la persona */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--fg)]">Alertas</h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/alerts">
              <BellIcon className="size-4" />
              Ver todas
            </Link>
          </Button>
        </div>
        {alertas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-sm text-[var(--fg-muted)]">
            Sin alertas para este afiliado.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <ul className="divide-y divide-[var(--border)]">
              {alertas.map((a) => {
                const tone = priorityToTone(a.prioridad);
                return (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: TONE_VARS[tone].solid }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--fg)]">{a.titulo}</p>
                      <p className="text-xs text-[var(--fg-muted)]">{a.mensaje}</p>
                      <p className="mt-0.5 text-xs text-[var(--fg-subtle)] tabular-nums">{timeAgo(a.createdAt)}</p>
                    </div>
                    <Badge variant={a.estado === 'PENDIENTE' ? 'media' : 'secondary'}>{a.estado}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <AfiliacionFormModal
        open={afiliacionModalOpen}
        onOpenChange={setAfiliacionModalOpen}
        personaId={personaId}
        administradoraId={persona.administradoraId}
        onSaved={() => loadAfiliaciones()}
      />

      {afiliacionParaVincular && (
        <VincularPersonaModal
          open={vincularModalOpen}
          onOpenChange={setVincularModalOpen}
          afiliacionTitular={{ ...afiliacionParaVincular, persona }}
          onVinculado={(vinculo, personaVinculadaId) => {
            handleVinculoCreado(vinculo, personaVinculadaId);
          }}
        />
      )}

      <VincularProfesionalModal
        open={vincularProfesionalModalOpen}
        onOpenChange={setVincularProfesionalModalOpen}
        persona={persona}
        excludedProfesionalIds={terceros.map((link) => link.profesionalId)}
        onVinculado={() => loadTerceros()}
      />
    </div>
  );
}

function InfoItem({ label, value, tabular }: { label: string; value?: string; tabular?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--fg-subtle)]">{label}</dt>
      <dd className={`text-[var(--fg)] ${tabular ? 'tabular-nums' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

function AfiliacionCard({
  afiliacion,
  grupo,
  onEliminar,
  onVincular,
  onEliminarVinculo,
}: {
  afiliacion: Afiliacion;
  grupo?: GrupoTitular | GrupoAdherente;
  onEliminar: () => void;
  onVincular: () => void;
  onEliminarVinculo: (afiliacionId: string, vinculoId: string) => void;
}) {
  const esTitular = afiliacion.rol === 'TITULAR';
  const grupoTitular = esTitular ? (grupo as GrupoTitular | undefined) : undefined;
  const grupoAdherente = !esTitular ? (grupo as GrupoAdherente | undefined) : undefined;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-[var(--fg)]">{afiliacion.obraSocial?.nombre}</p>
            <Badge variant="outline">{afiliacion.rol === 'TITULAR' ? 'Titular' : 'Adherente'}</Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            {afiliacion.numeroAfiliado && <span className="tabular-nums">N° {afiliacion.numeroAfiliado}</span>}
            {afiliacion.plan && <span> · Plan {afiliacion.plan}</span>}
            {afiliacion.fechaAlta && <span className="tabular-nums"> · Alta {afiliacion.fechaAlta.slice(0, 10)}</span>}
          </p>
        </div>
        <button
          onClick={onEliminar}
          className="rounded-md p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--sev-critica-bg)] hover:text-[var(--sev-critica-fg)]"
          title="Eliminar afiliación"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {esTitular && (
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
              <Users className="size-3.5" />
              Adherentes
            </p>
            <Button size="sm" variant="subtle" onClick={onVincular}>
              <Plus className="size-3.5" />
              Agregar adherente
            </Button>
          </div>
          {!grupoTitular || grupoTitular.adherentes.length === 0 ? (
            <p className="text-sm text-[var(--fg-subtle)]">Sin adherentes.</p>
          ) : (
            <ul className="space-y-1.5">
              {grupoTitular.adherentes.map((item) => (
                <li key={item.vinculoId} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <Badge variant="secondary" className="mr-1.5">
                      {item.parentesco.nombre}
                    </Badge>
                    <Link
                      href={`/dashboard/afiliados/${item.afiliacion.personaId}`}
                      className="font-medium text-[var(--primary-700)] hover:underline"
                    >
                      {item.afiliacion.persona?.apellido}, {item.afiliacion.persona?.nombre}
                    </Link>
                  </span>
                  <button
                    onClick={() => onEliminarVinculo(afiliacion.id, item.vinculoId)}
                    className="text-xs text-[var(--fg-subtle)] hover:text-[var(--sev-critica-fg)]"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!esTitular && (
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
            <Users className="size-3.5" />
            Titular/es
          </p>
          {!grupoAdherente || grupoAdherente.titulares.length === 0 ? (
            <p className="text-sm text-[var(--fg-subtle)]">Sin titular vinculado.</p>
          ) : (
            <ul className="space-y-1.5">
              {grupoAdherente.titulares.map((item) => (
                <li key={item.vinculoId} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <Badge variant="secondary" className="mr-1.5">
                      {item.parentesco.nombre}
                    </Badge>
                    <Link
                      href={`/dashboard/afiliados/${item.afiliacion.personaId}`}
                      className="font-medium text-[var(--primary-700)] hover:underline"
                    >
                      {item.afiliacion.persona?.apellido}, {item.afiliacion.persona?.nombre}
                    </Link>
                  </span>
                  <button
                    onClick={() => onEliminarVinculo(afiliacion.id, item.vinculoId)}
                    className="text-xs text-[var(--fg-subtle)] hover:text-[var(--sev-critica-fg)]"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
