import { createCrudService } from '@/lib/crudFactory';
import { Afiliado, CreateAfiliadoDto, UpdateAfiliadoDto } from '@/types';

class AfiliadosService {
  private base = createCrudService<Afiliado, CreateAfiliadoDto, UpdateAfiliadoDto>('/afiliados');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const afiliadosService = new AfiliadosService();
