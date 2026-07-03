import api from '@/lib/axios';
import { Afiliado, CreateAfiliadoDto, UpdateAfiliadoDto, PaginatedResponse, PaginationParams } from '@/types';

class AfiliadosService {
  async getAll(): Promise<Afiliado[]> {
    const response = await api.get<Afiliado[]>('/afiliados');
    return response.data;
  }

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: PaginationParams): Promise<PaginatedResponse<Afiliado>> {
    const response = await api.get<PaginatedResponse<Afiliado>>('/afiliados', { params });
    return response.data;
  }

  async getById(id: string): Promise<Afiliado> {
    const response = await api.get<Afiliado>(`/afiliados/${id}`);
    return response.data;
  }

  async create(data: CreateAfiliadoDto): Promise<Afiliado> {
    const response = await api.post<Afiliado>('/afiliados', data);
    return response.data;
  }

  async update(id: string, data: UpdateAfiliadoDto): Promise<Afiliado> {
    const response = await api.patch<Afiliado>(`/afiliados/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/afiliados/${id}`);
  }
}

export const afiliadosService = new AfiliadosService();
