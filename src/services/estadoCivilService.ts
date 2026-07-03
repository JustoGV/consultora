import { createCrudService } from '@/lib/crudFactory';
import { EstadoCivil, CreateEstadoCivilDto, UpdateEstadoCivilDto } from '@/types';

class EstadoCivilService {
  private base = createCrudService<EstadoCivil, CreateEstadoCivilDto, UpdateEstadoCivilDto>('/estado-civil');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const estadoCivilService = new EstadoCivilService();
