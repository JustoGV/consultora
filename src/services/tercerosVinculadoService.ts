import { createCrudService } from '@/lib/crudFactory';
import { TercerosVinculado, CreateTercerosVinculadoDto, UpdateTercerosVinculadoDto } from '@/types';

class TercerosVinculadoService {
  private base = createCrudService<TercerosVinculado, CreateTercerosVinculadoDto, UpdateTercerosVinculadoDto>('/terceros-vinculado');

  getAll = this.base.getAll;
  getPaginated = this.base.getPaginated;
  getById = this.base.getById;
  create = this.base.create;
  update = this.base.update;
  delete = this.base.delete;
}

export const tercerosVinculadoService = new TercerosVinculadoService();
