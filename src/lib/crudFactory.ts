import api from '@/lib/axios';
import { PaginatedResponse, PaginationParams } from '@/types';

/**
 * Generic CRUD service factory.
 *
 * Wraps the repetitive getAll/getPaginated/getById/create/update/delete
 * pattern shared by most `src/services/*Service.ts` files. Services with
 * custom sub-resources or non-standard endpoints (e.g. orientacionPrestacionalService,
 * alertasService) should NOT use this factory — keep those hand-written.
 *
 * `TQuery` is an optional extra query-params shape (e.g. `{ administradoraId?: string }`)
 * accepted by getAll/getPaginated, matching services like efectoresService/servicesService.
 */
export function createCrudService<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
  TQuery extends object = Record<string, never>
>(resourcePath: string) {
  return {
    async getAll(params?: TQuery): Promise<T[]> {
      const response = await api.get<T[]>(resourcePath, { params });
      return response.data;
    },

    /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
    async getPaginated(params: TQuery & PaginationParams): Promise<PaginatedResponse<T>> {
      const response = await api.get<PaginatedResponse<T>>(resourcePath, { params });
      return response.data;
    },

    async getById(id: string): Promise<T> {
      const response = await api.get<T>(`${resourcePath}/${id}`);
      return response.data;
    },

    async create(data: CreateDto): Promise<T> {
      const response = await api.post<T>(resourcePath, data);
      return response.data;
    },

    async update(id: string, data: UpdateDto): Promise<T> {
      const response = await api.patch<T>(`${resourcePath}/${id}`, data);
      return response.data;
    },

    async delete(id: string): Promise<void> {
      await api.delete(`${resourcePath}/${id}`);
    },

    async restore(id: string, restorePath = 'restore'): Promise<T> {
      const response = await api.patch<T>(`${resourcePath}/${id}/${restorePath}`);
      return response.data;
    },
  };
}
