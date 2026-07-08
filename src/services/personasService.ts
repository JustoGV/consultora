import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import {
  Persona,
  CreatePersonaDto,
  UpdatePersonaDto,
  FindPersonasQuery,
  PersonaProfesional,
  CreatePersonaProfesionalDto,
} from '@/types';

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

  /**
   * Terceros vinculados (profesionales) a nivel PERSONA (UX-17) — no dependen
   * de que la persona tenga afiliación con una obra social, así que funcionan
   * igual para particulares/pacientes de hospital.
   */

  /** GET /personas/:id/profesionales — vínculos activos, cada uno con `profesional` cargado. */
  async getTercerosVinculados(personaId: string): Promise<PersonaProfesional[]> {
    const response = await api.get<PersonaProfesional[]>(`/personas/${personaId}/profesionales`);
    return response.data;
  }

  /** POST /personas/:id/profesionales — 409 si ya está vinculado, 400 si distinta administradora. */
  async linkTerceroVinculado(
    personaId: string,
    dto: CreatePersonaProfesionalDto
  ): Promise<PersonaProfesional> {
    const response = await api.post<PersonaProfesional>(`/personas/${personaId}/profesionales`, dto);
    return response.data;
  }

  /** DELETE /personas/:id/profesionales/:linkId — desvincula (soft-delete). */
  async unlinkTerceroVinculado(personaId: string, linkId: string): Promise<void> {
    await api.delete(`/personas/${personaId}/profesionales/${linkId}`);
  }
}

export const personasService = new PersonasService();
