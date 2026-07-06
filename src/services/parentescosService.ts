import { createCrudService } from '@/lib/crudFactory';
import { Parentesco, CreateParentescoDto, UpdateParentescoDto } from '@/types';

class ParentescosService {
  private base = createCrudService<Parentesco, CreateParentescoDto, UpdateParentescoDto>('/parentescos');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;

  /** A diferencia de personas/afiliaciones/profesionales, acá el restore path SÍ es
   *  el default 'restore' del factory — explícito de todos modos para que quede
   *  documentado en el código y no haya que ir a mirar el controller para saberlo. */
  restore = (id: string) => this.base.restore(id, 'restore');
}

export const parentescosService = new ParentescosService();
