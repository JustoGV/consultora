import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import {
  Afiliacion,
  CreateAfiliacionDto,
  UpdateAfiliacionDto,
  FindAfiliacionesQuery,
  AfiliacionVinculo,
  CreateVinculoDto,
  AfiliacionProfesional,
  CreateAfiliacionProfesionalDto,
} from '@/types';

/**
 * GET /afiliaciones/:id/grupo — no hay certeza documentada del shape exacto de
 * respuesta (el controller lo delega tal cual al service, que no forma parte
 * del contrato transcripto para este ítem). Se tipa como `unknown` a propósito
 * en vez de inventar un shape falso; el consumidor deberá angostar el tipo
 * cuando lo use.
 */
export type GrupoAfiliacion = unknown;

class AfiliacionesService {
  private base = createCrudService<Afiliacion, CreateAfiliacionDto, UpdateAfiliacionDto, FindAfiliacionesQuery>('/afiliaciones');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;

  /** El backend expone el restore de afiliaciones en 'restaurar', no en el 'restore' default de la factory. */
  restore = (id: string) => this.base.restore(id, 'restaurar');

  async getVinculos(id: string): Promise<AfiliacionVinculo[]> {
    const response = await api.get<AfiliacionVinculo[]>(`/afiliaciones/${id}/vinculos`);
    return response.data;
  }

  /** `id` es la afiliación ADHERENTE — la titular va dentro del body (CreateVinculoDto). */
  async createVinculo(id: string, dto: CreateVinculoDto): Promise<AfiliacionVinculo> {
    const response = await api.post<AfiliacionVinculo>(`/afiliaciones/${id}/vinculos`, dto);
    return response.data;
  }

  async deleteVinculo(id: string, vinculoId: string): Promise<void> {
    await api.delete(`/afiliaciones/${id}/vinculos/${vinculoId}`);
  }

  /** GET /afiliaciones/:id/profesionales — vínculos activos, cada uno con `profesional` cargado. */
  async getProfesionales(id: string): Promise<AfiliacionProfesional[]> {
    const response = await api.get<AfiliacionProfesional[]>(`/afiliaciones/${id}/profesionales`);
    return response.data;
  }

  /** POST /afiliaciones/:id/profesionales — 409 si ya está vinculado, 400 si distinta administradora. */
  async linkProfesional(id: string, dto: CreateAfiliacionProfesionalDto): Promise<AfiliacionProfesional> {
    const response = await api.post<AfiliacionProfesional>(`/afiliaciones/${id}/profesionales`, dto);
    return response.data;
  }

  /** DELETE /afiliaciones/:id/profesionales/:linkId — desvincula (soft-delete). */
  async unlinkProfesional(id: string, linkId: string): Promise<void> {
    await api.delete(`/afiliaciones/${id}/profesionales/${linkId}`);
  }

  async getGrupo(id: string): Promise<GrupoAfiliacion> {
    const response = await api.get<GrupoAfiliacion>(`/afiliaciones/${id}/grupo`);
    return response.data;
  }
}

export const afiliacionesService = new AfiliacionesService();
