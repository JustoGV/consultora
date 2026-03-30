import api from '@/lib/axios';
import {
  ServicioNoNomenclado,
  CreateServicioNoNomencladoDto,
  UpdateServicioNoNomencladoDto,
} from '@/types';

interface GetServiciosNoNomencladosParams {
  administradoraId?: string;
}

export const serviciosNoNomencladosService = {
  async getAll(params?: GetServiciosNoNomencladosParams): Promise<ServicioNoNomenclado[]> {
    const response = await api.get<ServicioNoNomenclado[]>('/servicios-no-nomenclados', { params });
    return response.data;
  },

  async getById(id: string): Promise<ServicioNoNomenclado> {
    const response = await api.get<ServicioNoNomenclado>(`/servicios-no-nomenclados/${id}`);
    return response.data;
  },

  async getByPrestador(prestadorId: string): Promise<ServicioNoNomenclado[]> {
    const response = await api.get<ServicioNoNomenclado[]>(`/servicios-no-nomenclados/prestador/${prestadorId}`);
    return response.data;
  },

  async create(data: CreateServicioNoNomencladoDto): Promise<ServicioNoNomenclado> {
    const response = await api.post<ServicioNoNomenclado>('/servicios-no-nomenclados', data);
    return response.data;
  },

  async update(id: string, data: UpdateServicioNoNomencladoDto): Promise<ServicioNoNomenclado> {
    const response = await api.patch<ServicioNoNomenclado>(`/servicios-no-nomenclados/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/servicios-no-nomenclados/${id}`);
    return response.data;
  },

  async restore(id: string): Promise<ServicioNoNomenclado> {
    const response = await api.patch<ServicioNoNomenclado>(`/servicios-no-nomenclados/${id}/restaurar`);
    return response.data;
  },
};
