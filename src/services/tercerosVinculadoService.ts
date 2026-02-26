import api from '@/lib/axios';
import { TercerosVinculado, CreateTercerosVinculadoDto, UpdateTercerosVinculadoDto } from '@/types';

class TercerosVinculadoService {
  async getAll(): Promise<TercerosVinculado[]> {
    const response = await api.get<TercerosVinculado[]>('/terceros-vinculado');
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
