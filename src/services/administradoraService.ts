import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Administradora, CreateAdministradoraDto, UpdateAdministradoraDto } from '@/types';

const base = createCrudService<Administradora, CreateAdministradoraDto, UpdateAdministradoraDto>('/administradoras');

export const administradoraService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,

  async restore(id: string): Promise<Administradora> {
    const response = await api.patch<Administradora>(`/administradoras/${id}/restore`);
    return response.data;
  }
};
