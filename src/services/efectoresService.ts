import api from '@/lib/axios';
import { Efector, CreateEfectorDto, UpdateEfectorDto } from '@/types';

interface GetEfectoresParams {
  administradoraId?: string;
}

export const efectoresService = {
  async getAll(params?: GetEfectoresParams): Promise<Efector[]> {
    const response = await api.get<Efector[]>('/efectores', { params });
    return response.data;
  },

  async getById(id: string): Promise<Efector> {
    const response = await api.get<Efector>(`/efectores/${id}`);
    return response.data;
  },

  async create(data: CreateEfectorDto): Promise<Efector> {
    const response = await api.post<Efector>('/efectores', data);
    return response.data;
  },

  async update(id: string, data: UpdateEfectorDto): Promise<Efector> {
    const response = await api.patch<Efector>(`/efectores/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/efectores/${id}`);
    return response.data;
  },

  async restore(id: string): Promise<Efector> {
    const response = await api.patch<Efector>(`/efectores/${id}/restaurar`);
    return response.data;
  },
};
