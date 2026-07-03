import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Efector, CreateEfectorDto, UpdateEfectorDto } from '@/types';

interface GetEfectoresParams {
  administradoraId?: string;
}

const base = createCrudService<Efector, CreateEfectorDto, UpdateEfectorDto, GetEfectoresParams>('/efectores');

export const efectoresService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/efectores/${id}`);
    return response.data;
  },

  async restore(id: string): Promise<Efector> {
    const response = await api.patch<Efector>(`/efectores/${id}/restaurar`);
    return response.data;
  },
};
