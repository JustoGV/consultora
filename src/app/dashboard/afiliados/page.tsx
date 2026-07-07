'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Persona, Afiliacion, ObraSocial } from '@/types';
import { personasService } from '@/services/personasService';
import { afiliacionesService } from '@/services/afiliacionesService';
import { obrasSocialesService } from '@/services/obrasSocialesService';
import { calcularEdad } from '@/lib/age';
import { extractErrorMessage } from '@/lib/errorUtils';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import AfiliadoFormModal from './AfiliadoFormModal';

const DEBOUNCE_MS = 300;

type RolFiltro = '' | 'TITULAR' | 'ADHERENTE' | 'SIN_AFILIACION';

const ROL_OPTIONS: { value: RolFiltro; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'TITULAR', label: 'Titulares' },
  { value: 'ADHERENTE', label: 'Adherentes' },
  { value: 'SIN_AFILIACION', label: 'Sin afiliación' },
];

export default function AfiliadosPage() {
  const router = useRouter();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [rolFiltro, setRolFiltro] = useState<RolFiltro>('');
  const [obraSocialFiltro, setObraSocialFiltro] = useState('');
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);

  // Afiliaciones indexadas por personaId, para armar badges y aplicar el
  // filtro de rol/obra social client-side: el backend todavía NO implementa
  // esos filtros en GET /personas (TODO(B-5) en personas.service.ts) — ver
  // desvío documentado en el reporte final.
  const [afiliacionesPorPersona, setAfiliacionesPorPersona] = useState<Record<string, Afiliacion[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    obrasSocialesService
      .getAll()
      .then(setObrasSociales)
      .catch(() => setObrasSociales([]));
  }, []);

  const loadAfiliaciones = useCallback(async () => {
    try {
      const all = await afiliacionesService.getAll();
      const map: Record<string, Afiliacion[]> = {};
      for (const af of all) {
        if (!map[af.personaId]) map[af.personaId] = [];
        map[af.personaId].push(af);
      }
      setAfiliacionesPorPersona(map);
    } catch {
      setAfiliacionesPorPersona({});
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await personasService.getPaginated({ search: search || undefined, page, limit });
      setPersonas(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al cargar afiliados:', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadAfiliaciones();
  }, [loadAfiliaciones]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), DEBOUNCE_MS);
  };

  // Alt+N — atajo global para "Nuevo afiliado"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setEditingPersona(null);
        setModalOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredPersonas = personas.filter((p) => {
    if (!rolFiltro) return true;
    const afiliaciones = (afiliacionesPorPersona[p.id] || []).filter((a) => a.activo);
    if (rolFiltro === 'SIN_AFILIACION') return afiliaciones.length === 0;
    const hasRol = afiliaciones.some((a) => a.rol === rolFiltro);
    if (!hasRol) return false;
    if (obraSocialFiltro) return afiliaciones.some((a) => a.obraSocialId === obraSocialFiltro && a.rol === rolFiltro);
    return true;
  });

  const columns: DataTableColumn<Persona>[] = [
    {
      id: 'apellido',
      header: 'Apellido y Nombre',
      cell: (p) => (
        <span className="font-medium text-[var(--fg)]">
          {p.apellido}, {p.nombre}
        </span>
      ),
    },
    {
      id: 'documento',
      header: 'Documento',
      cell: (p) => `${p.tipoDocumento} ${p.numeroDocumento}`,
      numeric: true,
      align: 'right',
    },
    {
      id: 'edad',
      header: 'Edad',
      cell: (p) => calcularEdad(p.fechaNacimiento),
      numeric: true,
      align: 'right',
    },
    {
      id: 'afiliaciones',
      header: 'Afiliaciones',
      cell: (p) => {
        const afiliaciones = (afiliacionesPorPersona[p.id] || []).filter((a) => a.activo);
        if (afiliaciones.length === 0) {
          return (
            <Badge variant="secondary" title="Sin afiliaciones">
              Particular
            </Badge>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {afiliaciones.map((a) => {
              const os = obrasSociales.find((o) => o.id === a.obraSocialId);
              const sigla = os?.sigla || os?.nombre || '?';
              const rolLetra = a.rol === 'TITULAR' ? 'T' : 'A';
              return (
                <Badge key={a.id} variant="outline" title={os?.nombre || ''}>
                  {sigla}·{rolLetra}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      id: 'activo',
      header: 'Activo',
      cell: (p) => (
        <Badge variant={p.activo ? 'baja' : 'secondary'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--fg)]">Afiliados</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Identidad, afiliación y adherentes de cada afiliado.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPersona(null);
            setModalOpen(true);
          }}
        >
          <UserPlus className="size-4" />
          Nuevo afiliado
          <kbd className="ml-1 rounded border border-white/30 bg-white/10 px-1 text-[10px]">Alt+N</kbd>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <SearchableSelect
            options={ROL_OPTIONS}
            value={rolFiltro}
            onChange={(v) => setRolFiltro(v as RolFiltro)}
            placeholder="Rol"
          />
        </div>
        <div className="w-64">
          <SearchableSelect
            options={[{ value: '', label: 'Todas las obras sociales' }, ...obrasSociales.map((o) => ({ value: o.id, label: o.nombre }))]}
            value={obraSocialFiltro}
            onChange={setObraSocialFiltro}
            placeholder="Obra social"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredPersonas}
        getRowId={(p) => p.id}
        loading={loading}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, apellido, documento o CUIL…"
        onRowClick={(p) => router.push(`/dashboard/afiliados/${p.id}`)}
        pagination={
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={(v) => {
              setLimit(v);
              setPage(1);
            }}
          />
        }
        emptyTitle="Sin afiliados"
        emptyDescription="Cargá el primero para empezar."
        emptyAction={
          <Button
            onClick={() => {
              setEditingPersona(null);
              setModalOpen(true);
            }}
          >
            Nuevo afiliado
          </Button>
        }
      />

      <AfiliadoFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        persona={editingPersona}
        onSaved={() => {
          load();
        }}
        defaultContinuous={!editingPersona}
      />
    </div>
  );
}
