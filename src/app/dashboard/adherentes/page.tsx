'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UsersRound } from 'lucide-react';
import { Afiliacion, Parentesco } from '@/types';
import { afiliacionesService } from '@/services/afiliacionesService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { calcularEdad } from '@/lib/age';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/Pagination';

/** Shape of GET /afiliaciones/:id/grupo for an ADHERENTE (see afiliaciones.service.ts). */
type GrupoAdherente = {
  adherente: Afiliacion;
  titulares: { vinculoId: string; parentesco: Parentesco; afiliacion: Afiliacion }[];
};

/** An ADHERENTE afiliación enriched with its titular vínculos (parentesco + titular persona). */
type AdherenteRow = Afiliacion & {
  titulares: { vinculoId: string; parentesco: Parentesco; afiliacion: Afiliacion }[];
};

const PAGE_SIZE = 10;

/**
 * Standalone Adherentes screen (UX-12c). Lists every afiliación with rol
 * ADHERENTE, enriched with its titular vínculo(s) so each row shows the
 * parentesco and a link to the titular's ficha. Client-side search by
 * nombre/apellido/documento + client-side pagination (the list is small; the
 * server has no rol filter on personas yet — same pattern as the afiliados list).
 */
export default function AdherentesPage() {
  const router = useRouter();

  const [rows, setRows] = useState<AdherenteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const adherentes = await afiliacionesService.getAll({ rol: 'ADHERENTE' });
      const activos = adherentes.filter((a) => a.activo);
      const enriched = await Promise.all(
        activos.map(async (af) => {
          try {
            const grupo = (await afiliacionesService.getGrupo(af.id)) as GrupoAdherente;
            return { ...af, titulares: grupo.titulares || [] } as AdherenteRow;
          } catch {
            return { ...af, titulares: [] } as AdherenteRow;
          }
        })
      );
      setRows(enriched);
    } catch (err) {
      console.error('Error al cargar adherentes:', extractErrorMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const p = r.persona;
      if (!p) return false;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.numeroDocumento.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const columns: DataTableColumn<AdherenteRow>[] = [
    {
      id: 'apellido',
      header: 'Apellido',
      cell: (r) => <span className="font-medium text-[var(--fg)]">{r.persona?.apellido}</span>,
    },
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (r) => r.persona?.nombre,
    },
    {
      id: 'documento',
      header: 'Documento',
      cell: (r) => `${r.persona?.tipoDocumento} ${r.persona?.numeroDocumento}`,
      numeric: true,
      align: 'right',
    },
    {
      id: 'edad',
      header: 'Edad',
      cell: (r) => (r.persona?.fechaNacimiento ? calcularEdad(r.persona.fechaNacimiento) : '—'),
      numeric: true,
      align: 'right',
    },
    {
      id: 'parentesco',
      header: 'Parentesco',
      cell: (r) =>
        r.titulares.length === 0 ? (
          <span className="text-[var(--fg-subtle)]">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.titulares.map((t) => (
              <Badge key={t.vinculoId} variant="secondary">
                {t.parentesco.nombre}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      id: 'titular',
      header: 'Titular',
      cell: (r) =>
        r.titulares.length === 0 ? (
          <span className="text-[var(--fg-subtle)]">Sin titular</span>
        ) : (
          <div className="flex flex-col gap-0.5">
            {r.titulares.map((t) => (
              <Link
                key={t.vinculoId}
                href={`/dashboard/afiliados/${t.afiliacion.personaId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-[var(--primary-700)] hover:underline"
              >
                {t.afiliacion.persona
                  ? `${t.afiliacion.persona.apellido}, ${t.afiliacion.persona.nombre}`
                  : 'Ver titular'}
              </Link>
            ))}
          </div>
        ),
    },
    {
      id: 'obraSocial',
      header: 'Obra social',
      cell: (r) => (
        <Badge variant="outline" title={r.obraSocial?.nombre}>
          {r.obraSocial?.sigla || r.obraSocial?.nombre || '—'}
        </Badge>
      ),
    },
    {
      id: 'activo',
      header: 'Activo',
      cell: (r) => (
        <Badge variant={r.activo ? 'baja' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--primary-50)] text-[var(--primary-700)]">
          <UsersRound className="size-5" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-[var(--fg)]">Adherentes</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Personas a cargo de un titular, con su parentesco y obra social.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        getRowId={(r) => r.id}
        loading={loading}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, apellido o documento…"
        onRowClick={(r) => r.persona && router.push(`/dashboard/afiliados/${r.persona.id}`)}
        pagination={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        }
        emptyTitle="Sin adherentes"
        emptyDescription="Los adherentes se cargan desde el formulario de un afiliado."
      />
    </div>
  );
}
