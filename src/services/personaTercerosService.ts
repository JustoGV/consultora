import { createCrudService } from '@/lib/crudFactory';
import { PersonaTercerosVinculado, CreatePersonaTercerosVinculadoDto, UpdatePersonaTercerosVinculadoDto } from '@/types';

class PersonaTercerosService {
  private base = createCrudService<PersonaTercerosVinculado, CreatePersonaTercerosVinculadoDto, UpdatePersonaTercerosVinculadoDto>('/persona-terceros-vinculado');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const personaTercerosService = new PersonaTercerosService();
