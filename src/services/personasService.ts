import { createCrudService } from '@/lib/crudFactory';
import { Persona, CreatePersonaDto, UpdatePersonaDto, FindPersonasQuery } from '@/types';

class PersonasService {
  private base = createCrudService<Persona, CreatePersonaDto, UpdatePersonaDto, FindPersonasQuery>('/personas');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;

  /** El backend expone el restore de personas en 'restaurar', no en el 'restore' default de la factory. */
  restore = (id: string) => this.base.restore(id, 'restaurar');
}

export const personasService = new PersonasService();
