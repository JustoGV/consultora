import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Nomenclador, CreateNomencladorDto, UpdateNomencladorDto } from '@/types';

interface GetNomencladoresParams {
  administradoraId?: string;
}

const base = createCrudService<Nomenclador, CreateNomencladorDto, UpdateNomencladorDto, GetNomencladoresParams>('/nomenclador');

export const nomencladorService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,

  async restore(id: string): Promise<Nomenclador> {
    const response = await api.patch<Nomenclador>(`/nomenclador/${id}/restore`);
    return response.data;
  }
};
