import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import {
  Afiliacion,
  CreateAfiliacionDto,
  UpdateAfiliacionDto,
  FindAfiliacionesQuery,
  AfiliacionVinculo,
  CreateVinculoDto,
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

  // NOTA (UX-17): los terceros vinculados (profesionales) se movieron a nivel
  // PERSONA — ver personasService.getTercerosVinculados/linkTerceroVinculado/
  // unlinkTerceroVinculado (POST/GET/DELETE /personas/:id/profesionales). Los
  // endpoints /afiliaciones/:id/profesionales siguen existiendo en el backend
  // pero ya no se usan desde el frontend.

  async getGrupo(id: string): Promise<GrupoAfiliacion> {
    const response = await api.get<GrupoAfiliacion>(`/afiliaciones/${id}/grupo`);
    return response.data;
  }
}

export const afiliacionesService = new AfiliacionesService();
