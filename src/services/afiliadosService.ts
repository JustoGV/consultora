import api from '@/lib/axios';
import { Afiliado, CreateAfiliadoDto, UpdateAfiliadoDto } from '@/types';

class AfiliadosService {
  async getAll(): Promise<Afiliado[]> {
    const response = await api.get<Afiliado[]>('/afiliados');
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
