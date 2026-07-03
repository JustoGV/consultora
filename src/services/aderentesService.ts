import api from '@/lib/axios';
import { Aderente, CreateAderenteDto, UpdateAderenteDto, PaginatedResponse, PaginationParams } from '@/types';

class AderentesService {
  async getAll(): Promise<Aderente[]> {
    const response = await api.get<Aderente[]>('/aderentes');
    return response.data;
  }

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: PaginationParams): Promise<PaginatedResponse<Aderente>> {
    const response = await api.get<PaginatedResponse<Aderente>>('/aderentes', { params });
    return response.data;
  }

  async getByAfiliado(afiliadoId: string): Promise<Aderente[]> {
    const response = await api.get<Aderente[]>(`/aderentes/afiliado/${afiliadoId}`);
    return response.data;
  }

  async getById(id: string): Promise<Aderente> {
    const response = await api.get<Aderente>(`/aderentes/${id}`);
    return response.data;
  }

  async create(data: CreateAderenteDto): Promise<Aderente> {
    const response = await api.post<Aderente>('/aderentes', data);
    return response.data;
  }

  async update(id: string, data: UpdateAderenteDto): Promise<Aderente> {
    const response = await api.patch<Aderente>(`/aderentes/${id}`, data);
    return response.data;
  }

  async restore(id: string): Promise<Aderente> {
    const response = await api.patch<Aderente>(`/aderentes/${id}/restaurar`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/aderentes/${id}`);
  }
}

export const aderentesService = new AderentesService();
