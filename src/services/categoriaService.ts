import api from '@/lib/axios';
import { createCrudService } from '@/lib/crudFactory';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '@/types';

const base = createCrudService<Categoria, CreateCategoriaDto, UpdateCategoriaDto>('/categorias');

export const categoriaService = {
  getAll: base.getAll,
  getPaginated: base.getPaginated,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,

  async restore(id: string): Promise<Categoria> {
    const response = await api.patch<Categoria>(`/categorias/${id}/restore`);
    return response.data;
  }
};
