import { createCrudService } from '@/lib/crudFactory';
import { ObraSocial, CreateObraSocialDto, UpdateObraSocialDto } from '@/types';

class ObrasSocialesService {
  private base = createCrudService<ObraSocial, CreateObraSocialDto, UpdateObraSocialDto, { administradoraId?: string; search?: string }>('/obras-sociales');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;

  restore = (id: string) => this.base.restore(id, 'restaurar');
}

export const obrasSocialesService = new ObrasSocialesService();
