import api from '@/lib/axios';
import { TipoDiscapacidad, CreateTipoDiscapacidadDto, UpdateTipoDiscapacidadDto, PaginatedResponse, PaginationParams } from '@/types';

class TipoDiscapacidadService {
  async getAll(): Promise<TipoDiscapacidad[]> {
    const response = await api.get<TipoDiscapacidad[]>('/tipo-discapacidad');
    return response.data;
  }

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: PaginationParams): Promise<PaginatedResponse<TipoDiscapacidad>> {
    const response = await api.get<PaginatedResponse<TipoDiscapacidad>>('/tipo-discapacidad', { params });
    return response.data;
  }

  async getById(id: string): Promise<TipoDiscapacidad> {
    const response = await api.get<TipoDiscapacidad>(`/tipo-discapacidad/${id}`);
    return response.data;
  }

  async create(data: CreateTipoDiscapacidadDto): Promise<TipoDiscapacidad> {
    const response = await api.post<TipoDiscapacidad>('/tipo-discapacidad', data);
    return response.data;
  }

  async update(id: string, data: UpdateTipoDiscapacidadDto): Promise<TipoDiscapacidad> {
    const response = await api.patch<TipoDiscapacidad>(`/tipo-discapacidad/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/tipo-discapacidad/${id}`);
  }
}

export const tipoDiscapacidadService = new TipoDiscapacidadService();
