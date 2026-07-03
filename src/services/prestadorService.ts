import api from '@/lib/axios';
import { Prestador, CreatePrestadorDto, UpdatePrestadorDto, PaginatedResponse, PaginationParams } from '@/types';

interface GetPrestadoresParams {
  administradoraId?: string;
}

export const prestadorService = {
  async getAll(params?: GetPrestadoresParams): Promise<Prestador[]> {
    const response = await api.get<Prestador[]>('/prestadores', { params });
    return response.data;
  },

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: GetPrestadoresParams & PaginationParams): Promise<PaginatedResponse<Prestador>> {
    const response = await api.get<PaginatedResponse<Prestador>>('/prestadores', { params });
    return response.data;
  },

  async getById(id: string): Promise<Prestador> {
    const response = await api.get<Prestador>(`/prestadores/${id}`);
    return response.data;
  },

  async getByAdministradora(administradoraId: string): Promise<Prestador[]> {
    const response = await api.get<Prestador[]>(`/prestadores/administradora/${administradoraId}`);
    return response.data;
  },

  async create(data: CreatePrestadorDto): Promise<Prestador> {
    const response = await api.post<Prestador>('/prestadores', data);
    return response.data;
  },

  async update(id: string, data: UpdatePrestadorDto): Promise<Prestador> {
    const response = await api.patch<Prestador>(`/prestadores/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/prestadores/${id}`);
    return response.data;
  },

  async restore(id: string): Promise<Prestador> {
    const response = await api.patch<Prestador>(`/prestadores/${id}/restaurar`);
    return response.data;
  },
};
