import { TercerosVinculado, CreateTercerosVinculadoDto, UpdateTercerosVinculadoDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';

class TercerosVinculadoService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAll(): Promise<TercerosVinculado[]> {
    const response = await fetch(`${API_URL}/terceros-vinculado`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener terceros vinculados');
    }

    return response.json();
  }

  async getById(id: string): Promise<TercerosVinculado> {
    const response = await fetch(`${API_URL}/terceros-vinculado/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener tercero vinculado');
    }

    return response.json();
  }

  async create(data: CreateTercerosVinculadoDto): Promise<TercerosVinculado> {
    const response = await fetch(`${API_URL}/terceros-vinculado`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear tercero vinculado');
    }

    return response.json();
  }

  async update(id: string, data: UpdateTercerosVinculadoDto): Promise<TercerosVinculado> {
    const response = await fetch(`${API_URL}/terceros-vinculado/${id}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar tercero vinculado');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/terceros-vinculado/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar tercero vinculado');
    }
  }
}

export const tercerosVinculadoService = new TercerosVinculadoService();
