import api from '@/lib/axios';
import { Nomenclador, CreateNomencladorDto, UpdateNomencladorDto } from '@/types';

interface GetNomencladoresParams {
  administradoraId?: string;
}

export const nomencladorService = {
  async getAll(params?: GetNomencladoresParams): Promise<Nomenclador[]> {
    const response = await api.get<Nomenclador[]>('/nomenclador', { params });
    return response.data;
  },

  async getById(id: string): Promise<Nomenclador> {
    const response = await api.get<Nomenclador>(`/nomenclador/${id}`);
    return response.data;
  },

  async create(data: CreateNomencladorDto): Promise<Nomenclador> {
    const response = await api.post<Nomenclador>('/nomenclador', data);
    return response.data;
  },

  async update(id: string, data: UpdateNomencladorDto): Promise<Nomenclador> {
    const response = await api.patch<Nomenclador>(`/nomenclador/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/nomenclador/${id}`);
  },

  async restore(id: string): Promise<Nomenclador> {
    const response = await api.patch<Nomenclador>(`/nomenclador/${id}/restore`);
    return response.data;
  }
};
