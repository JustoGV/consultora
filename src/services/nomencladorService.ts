import api from '@/lib/axios';
import { Nomenclador, CreateNomencladorDto, UpdateNomencladorDto } from '@/types';

interface GetNomencladoresParams {
  categoriaId?: string;
  administradoraId?: string;
  activo?: boolean;
}

export const nomencladorService = {
  async getAll(params?: GetNomencladoresParams): Promise<Nomenclador[]> {
    const response = await api.get<Nomenclador[]>('/nomencladores', { params });
    return response.data;
  },

  async getById(id: string): Promise<Nomenclador> {
    const response = await api.get<Nomenclador>(`/nomencladores/${id}`);
    return response.data;
  },

  async create(data: CreateNomencladorDto): Promise<Nomenclador> {
    const response = await api.post<Nomenclador>('/nomencladores', data);
    return response.data;
  },

  async update(id: string, data: UpdateNomencladorDto): Promise<Nomenclador> {
    const response = await api.patch<Nomenclador>(`/nomencladores/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/nomencladores/${id}`);
  },

  async restore(id: string): Promise<Nomenclador> {
    const response = await api.patch<Nomenclador>(`/nomencladores/${id}/restore`);
    return response.data;
  }
};
