import { createCrudService } from '@/lib/crudFactory';
import { CertificadoDiscapacidad, CreateCertificadoDiscapacidadDto, UpdateCertificadoDiscapacidadDto } from '@/types';

class CertificadosDiscapacidadService {
  private base = createCrudService<CertificadoDiscapacidad, CreateCertificadoDiscapacidadDto, UpdateCertificadoDiscapacidadDto>('/certificados-discapacidad');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const certificadosDiscapacidadService = new CertificadosDiscapacidadService();
