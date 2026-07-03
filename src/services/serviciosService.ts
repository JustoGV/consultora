import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '@/types';

interface GetServiciosParams {
  administradoraId?: string;
}

const base = createCrudService<Servicio, CreateServicioDto, UpdateServicioDto, GetServiciosParams>('/servicios');

export const serviciosService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,

  async restore(id: string): Promise<Servicio> {
    const response = await api.patch<Servicio>(`/servicios/${id}/restore`);
    return response.data;
  }
};
