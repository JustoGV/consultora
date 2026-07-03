import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import {
  ServicioNoNomenclado,
  CreateServicioNoNomencladoDto,
  UpdateServicioNoNomencladoDto,
} from '@/types';

interface GetServiciosNoNomencladosParams {
  administradoraId?: string;
}

const base = createCrudService<ServicioNoNomenclado, CreateServicioNoNomencladoDto, UpdateServicioNoNomencladoDto, GetServiciosNoNomencladosParams>('/servicios-no-nomenclados');

export const serviciosNoNomencladosService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,

  async getByPrestador(prestadorId: string): Promise<ServicioNoNomenclado[]> {
    const response = await api.get<ServicioNoNomenclado[]>(`/servicios-no-nomenclados/prestador/${prestadorId}`);
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
