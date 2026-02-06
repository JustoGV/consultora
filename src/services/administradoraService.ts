import api from '@/lib/axios';
import { Administradora, CreateAdministradoraDto, UpdateAdministradoraDto } from '@/types';

export const administradoraService = {
  async getAll(): Promise<Administradora[]> {
    const response = await api.get<Administradora[]>('/administradoras');
    return response.data;
  },

  async getById(id: string): Promise<Administradora> {
    const response = await api.get<Administradora>(`/administradoras/${id}`);
    return response.data;
  },

  async create(data: CreateAdministradoraDto): Promise<Administradora> {
    const response = await api.post<Administradora>('/administradoras', data);
    return response.data;
  },

  async update(id: string, data: UpdateAdministradoraDto): Promise<Administradora> {
    const response = await api.patch<Administradora>(`/administradoras/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/administradoras/${id}`);
  },

  async restore(id: string): Promise<Administradora> {
    const response = await api.patch<Administradora>(`/administradoras/${id}/restore`);
    return response.data;
  }
};
