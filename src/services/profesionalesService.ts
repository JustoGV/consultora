import { createCrudService } from '@/lib/crudFactory';
import { Profesional, CreateProfesionalDto, UpdateProfesionalDto, FindProfesionalesQuery } from '@/types';

class ProfesionalesService {
  private base = createCrudService<Profesional, CreateProfesionalDto, UpdateProfesionalDto, FindProfesionalesQuery>('/profesionales');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;

  /** El backend expone el restore de profesionales en 'restaurar', no en el 'restore' default de la factory. */
  restore = (id: string) => this.base.restore(id, 'restaurar');
}

export const profesionalesService = new ProfesionalesService();
