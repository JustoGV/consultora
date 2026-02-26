import api from '@/lib/axios';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '@/types';

interface GetServiciosParams {
  administradoraId?: string;
}

export const serviciosService = {
  async getAll(params?: GetServiciosParams): Promise<Servicio[]> {
    const response = await api.get<Servicio[]>('/servicios', { params });
    return response.data;
  },

  async getById(id: string): Promise<Servicio> {
    const response = await api.get<Servicio>(`/servicios/${id}`);
    return response.data;
  },

  async create(data: CreateServicioDto): Promise<Servicio> {
    const response = await api.post<Servicio>('/servicios', data);
    return response.data;
  },

  async update(id: string, data: UpdateServicioDto): Promise<Servicio> {
    const response = await api.patch<Servicio>(`/servicios/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/servicios/${id}`);
  },

  async restore(id: string): Promise<Servicio> {
    const response = await api.patch<Servicio>(`/servicios/${id}/restore`);
    return response.data;
  }
};
