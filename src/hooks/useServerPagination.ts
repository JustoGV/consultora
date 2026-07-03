import { useCallback, useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';

/**
 * Hook de paginación SERVER-SIDE. Paralelo a `usePagination` (client-side) —
 * no lo reemplaza. Pensado para cuando se decida migrar una página puntual
 * a paginación server-side contra un endpoint que soporte `?page=&limit=`
 * y devuelva el envelope `PaginatedResponse<T>`.
 *
 * No está cableado a ninguna página todavía (AUD-24: solo deja la infra lista).
 *
 * Uso previsto:
 *   const { data, page, totalPages, isLoading, error, setPage, refetch } =
 *     useServerPagination((params) => afiliadosService.getPaginated(params), { limit: 20 });
 */

interface UseServerPaginationOptions {
  /** Página inicial (default 1). */
  initialPage?: number;
  /** Tamaño de página (default 10). */
  limit?: number;
  /** Si es false, no dispara el fetch automáticamente (default true). */
  enabled?: boolean;
}

interface UseServerPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: unknown;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => void;
}

export function useServerPagination<T>(
  fetchPage: (params: { page: number; limit: number }) => Promise<PaginatedResponse<T>>,
  options: UseServerPaginationOptions = {}
): UseServerPaginationResult<T> {
  const { initialPage = 1, limit: initialLimit = 10, enabled = true } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPage({ page, limit })
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, enabled, refetchTick]);

  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset a la primera página al cambiar el tamaño
  }, []);

  const refetch = useCallback(() => {
    setRefetchTick((tick) => tick + 1);
  }, []);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    setPage,
    setLimit: handleSetLimit,
    refetch
  };
}
