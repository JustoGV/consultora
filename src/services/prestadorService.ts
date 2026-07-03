import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Prestador, CreatePrestadorDto, UpdatePrestadorDto } from '@/types';

interface GetPrestadoresParams {
  administradoraId?: string;
}

const base = createCrudService<Prestador, CreatePrestadorDto, UpdatePrestadorDto, GetPrestadoresParams>('/prestadores');

export const prestadorService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,

  async getByAdministradora(administradoraId: string): Promise<Prestador[]> {
    const response = await api.get<Prestador[]>(`/prestadores/administradora/${administradoraId}`);
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
