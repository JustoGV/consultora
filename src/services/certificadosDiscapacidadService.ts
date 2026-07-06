import { createCrudService } from '@/lib/crudFactory';
import { CertificadoDiscapacidad, CreateCertificadoDiscapacidadDto, UpdateCertificadoDiscapacidadDto } from '@/types';

/** B-5.1 — filtro server-side por personaId (ver find-certificados-query.dto.ts en el backend). */
export interface FindCertificadosQuery {
  personaId?: string;
}

class CertificadosDiscapacidadService {
  private base = createCrudService<
    CertificadoDiscapacidad,
    CreateCertificadoDiscapacidadDto,
    UpdateCertificadoDiscapacidadDto,
    FindCertificadosQuery
  >('/certificados-discapacidad');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const certificadosDiscapacidadService = new CertificadosDiscapacidadService();
