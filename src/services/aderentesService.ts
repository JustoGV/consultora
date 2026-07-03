import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Aderente, CreateAderenteDto, UpdateAderenteDto } from '@/types';

class AderentesService {
  private base = createCrudService<Aderente, CreateAderenteDto, UpdateAderenteDto>('/aderentes');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;

  async getByAfiliado(afiliadoId: string): Promise<Aderente[]> {
    const response = await api.get<Aderente[]>(`/aderentes/afiliado/${afiliadoId}`);
    return response.data;
  }

  async restore(id: string): Promise<Aderente> {
    const response = await api.patch<Aderente>(`/aderentes/${id}/restaurar`);
    return response.data;
  }
}

export const aderentesService = new AderentesService();
