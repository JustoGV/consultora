'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, RotateCcw, Trash2, UserPlus } from 'lucide-react';
import { Profesional } from '@/types';
import { profesionalesService } from '@/services/profesionalesService';
import { extractErrorMessage } from '@/lib/errorUtils';
import { notify } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useSuccessConfirm } from '@/components/ui/success-confirm';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Pagination from '@/components/Pagination';
import ProfesionalFormModal from './ProfesionalFormModal';

const DEBOUNCE_MS = 300;

export default function ProfesionalesPage() {
  const confirm = useConfirm();
  const confirmSuccess = useSuccessConfirm();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState<Profesional | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await profesionalesService.getPaginated({ search: search || undefined, page, limit });
      setProfesionales(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al cargar profesionales:', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), DEBOUNCE_MS);
  };

  const openNew = () => {
    setEditingProfesional(null);
    setModalOpen(true);
  };

  const handleDelete = async (p: Profesional) => {
    const ok = await confirm({
      title: 'Eliminar tercero vinculado',
      description: `Se dará de baja a ${p.apellido}, ${p.nombre}. Podés reactivarlo luego.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await profesionalesService.delete(p.id);
      await load();
      confirmSuccess('Tercero vinculado dado de baja');
    } catch (error) {
      notify.error('No se pudo eliminar', extractErrorMessage(error));
    }
  };

  const handleRestore = async (p: Profesional) => {
    try {
      await profesionalesService.restore(p.id);
      await load();
      confirmSuccess('Tercero vinculado reactivado');
    } catch (error) {
      notify.error('No se pudo reactivar', extractErrorMessage(error));
    }
  };

  const columns: DataTableColumn<Profesional>[] = [
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
      id: 'matricula',
      header: 'Matrícula',
      cell: (p) => p.matricula,
      numeric: true,
      align: 'right',
    },
    {
      id: 'especialidad',
      header: 'Especialidad',
      cell: (p) => p.especialidad || '—',
    },
    {
      id: 'cuit',
      header: 'CUIT',
      cell: (p) => p.cuit || '—',
      numeric: true,
      align: 'right',
    },
    {
      id: 'activo',
      header: 'Activo',
      cell: (p) => (
        <Badge variant={p.activo ? 'baja' : 'secondary'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      id: 'acciones',
      header: '',
      align: 'right',
      className: 'w-10',
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-[var(--fg-subtle)] hover:bg-[var(--surface-sunken)] hover:text-[var(--fg)]"
              aria-label="Acciones"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onSelect={() => {
                setEditingProfesional(p);
                setModalOpen(true);
              }}
            >
              <Pencil />
              Editar
            </DropdownMenuItem>
            {p.activo ? (
              <DropdownMenuItem
                onSelect={() => handleDelete(p)}
                className="text-[var(--sev-critica-fg)] focus:bg-[var(--sev-critica-bg)] focus:text-[var(--sev-critica-fg)]"
              >
                <Trash2 />
                Eliminar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => handleRestore(p)}>
                <RotateCcw />
                Restaurar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--fg)]">Terceros Vinculados</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Kinesiólogos, médicos y demás profesionales prestadores: matrícula, especialidad y contacto.
          </p>
        </div>
        <Button onClick={openNew}>
          <UserPlus className="size-4" />
          Nuevo tercero vinculado
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={profesionales}
        getRowId={(p) => p.id}
        loading={loading}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre, apellido o matrícula…"
        onRowClick={(p) => {
          setEditingProfesional(p);
          setModalOpen(true);
        }}
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
        emptyTitle="Sin terceros vinculados"
        emptyDescription="Cargá el primero para empezar."
        emptyAction={<Button onClick={openNew}>Nuevo tercero vinculado</Button>}
      />

      <ProfesionalFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profesional={editingProfesional}
        onSaved={() => load()}
        defaultContinuous={!editingProfesional}
      />
    </div>
  );
}
