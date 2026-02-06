import api from '@/lib/axios';
import { Categoria, CreateCategoriaDto, UpdateCategoriaDto } from '@/types';

export const categoriaService = {
  async getAll(): Promise<Categoria[]> {
    const response = await api.get<Categoria[]>('/categorias');
    return response.data;
  },

  async getById(id: string): Promise<Categoria> {
    const response = await api.get<Categoria>(`/categorias/${id}`);
    return response.data;
  },

  async create(data: CreateCategoriaDto): Promise<Categoria> {
    const response = await api.post<Categoria>('/categorias', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoriaDto): Promise<Categoria> {
    const response = await api.patch<Categoria>(`/categorias/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`);
  },

  async restore(id: string): Promise<Categoria> {
    const response = await api.patch<Categoria>(`/categorias/${id}/restore`);
    return response.data;
  }
};
