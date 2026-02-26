import api from '@/lib/axios';
import { EstadoCivil, CreateEstadoCivilDto, UpdateEstadoCivilDto } from '@/types';

class EstadoCivilService {
  async getAll(): Promise<EstadoCivil[]> {
    const response = await api.get<EstadoCivil[]>('/estado-civil');
    return response.data;
  }

  async getById(id: string): Promise<EstadoCivil> {
    const response = await api.get<EstadoCivil>(`/estado-civil/${id}`);
    return response.data;
  }

  async create(data: CreateEstadoCivilDto): Promise<EstadoCivil> {
    const response = await api.post<EstadoCivil>('/estado-civil', data);
    return response.data;
  }

  async update(id: string, data: UpdateEstadoCivilDto): Promise<EstadoCivil> {
    const response = await api.patch<EstadoCivil>(`/estado-civil/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/estado-civil/${id}`);
  }
}

export const estadoCivilService = new EstadoCivilService();
