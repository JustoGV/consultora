import { createCrudService } from '@/lib/crudFactory';
import { TipoDiscapacidad, CreateTipoDiscapacidadDto, UpdateTipoDiscapacidadDto } from '@/types';

class TipoDiscapacidadService {
  private base = createCrudService<TipoDiscapacidad, CreateTipoDiscapacidadDto, UpdateTipoDiscapacidadDto>('/tipo-discapacidad');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const tipoDiscapacidadService = new TipoDiscapacidadService();
