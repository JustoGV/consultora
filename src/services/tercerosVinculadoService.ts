import api from '@/lib/axios';
import { TercerosVinculado, CreateTercerosVinculadoDto, UpdateTercerosVinculadoDto, PaginatedResponse, PaginationParams } from '@/types';

class TercerosVinculadoService {
  async getAll(): Promise<TercerosVinculado[]> {
    const response = await api.get<TercerosVinculado[]>('/terceros-vinculado');
    return response.data;
  }

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: PaginationParams): Promise<PaginatedResponse<TercerosVinculado>> {
    const response = await api.get<PaginatedResponse<TercerosVinculado>>('/terceros-vinculado', { params });
    return response.data;
  }

  async getById(id: string): Promise<TercerosVinculado> {
    const response = await api.get<TercerosVinculado>(`/terceros-vinculado/${id}`);
    return response.data;
  }

  async create(data: CreateTercerosVinculadoDto): Promise<TercerosVinculado> {
    const response = await api.post<TercerosVinculado>('/terceros-vinculado', data);
    return response.data;
  }

  async update(id: string, data: UpdateTercerosVinculadoDto): Promise<TercerosVinculado> {
    const response = await api.patch<TercerosVinculado>(`/terceros-vinculado/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/terceros-vinculado/${id}`);
  }
}

export const tercerosVinculadoService = new TercerosVinculadoService();
