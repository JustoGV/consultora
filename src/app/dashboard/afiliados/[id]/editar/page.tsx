'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Persona } from '@/types';
import { personasService } from '@/services/personasService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { Button } from '@/components/ui/button';
import AfiliadoForm from '../../AfiliadoForm';

/** Edición de afiliado — carga el titular y monta el formulario todo-en-uno. */
export default function EditarAfiliadoPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.id as string;

  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await personasService.getById(personaId);
      setPersona(p);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [personaId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <span className="skeleton block h-8 w-64 rounded" />
        <span className="skeleton block h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-md border border-[var(--sev-critica)] bg-[var(--sev-critica-bg)] px-4 py-3 text-sm text-[var(--sev-critica-fg)]">
          {error || 'Afiliado no encontrado.'}
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/afiliados')}>
          Volver a Afiliados
        </Button>
      </div>
    );
  }

  return <AfiliadoForm persona={persona} />;
}
