import { PersonaTercerosVinculado, CreatePersonaTercerosVinculadoDto, UpdatePersonaTercerosVinculadoDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';

class PersonaTercerosService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAll(): Promise<PersonaTercerosVinculado[]> {
    const response = await fetch(`${API_URL}/persona-terceros-vinculado`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener relaciones persona-terceros');
    }

    return response.json();
  }

  async getById(id: string): Promise<PersonaTercerosVinculado> {
    const response = await fetch(`${API_URL}/persona-terceros-vinculado/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener relación persona-tercero');
    }

    return response.json();
  }

  async create(data: CreatePersonaTercerosVinculadoDto): Promise<PersonaTercerosVinculado> {
    const response = await fetch(`${API_URL}/persona-terceros-vinculado`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear relación persona-tercero');
    }

    return response.json();
  }

  async update(id: string, data: UpdatePersonaTercerosVinculadoDto): Promise<PersonaTercerosVinculado> {
    const response = await fetch(`${API_URL}/persona-terceros-vinculado/${id}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar relación persona-tercero');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/persona-terceros-vinculado/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar relación persona-tercero');
    }
  }
}

export const personaTercerosService = new PersonaTercerosService();
