import api from '@/lib/axios';
import { PersonaTercerosVinculado, CreatePersonaTercerosVinculadoDto, UpdatePersonaTercerosVinculadoDto, PaginatedResponse, PaginationParams } from '@/types';

class PersonaTercerosService {
  async getAll(): Promise<PersonaTercerosVinculado[]> {
    const response = await api.get<PersonaTercerosVinculado[]>('/persona-terceros-vinculado');
    return response.data;
  }

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: PaginationParams): Promise<PaginatedResponse<PersonaTercerosVinculado>> {
    const response = await api.get<PaginatedResponse<PersonaTercerosVinculado>>('/persona-terceros-vinculado', { params });
    return response.data;
  }

  async getById(id: string): Promise<PersonaTercerosVinculado> {
    const response = await api.get<PersonaTercerosVinculado>(`/persona-terceros-vinculado/${id}`);
    return response.data;
  }

  async create(data: CreatePersonaTercerosVinculadoDto): Promise<PersonaTercerosVinculado> {
    const response = await api.post<PersonaTercerosVinculado>('/persona-terceros-vinculado', data);
    return response.data;
  }

  async update(id: string, data: UpdatePersonaTercerosVinculadoDto): Promise<PersonaTercerosVinculado> {
    const response = await api.patch<PersonaTercerosVinculado>(`/persona-terceros-vinculado/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/persona-terceros-vinculado/${id}`);
  }
}

export const personaTercerosService = new PersonaTercerosService();
