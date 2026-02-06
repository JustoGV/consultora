import { EstadoCivil, CreateEstadoCivilDto, UpdateEstadoCivilDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';

class EstadoCivilService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAll(): Promise<EstadoCivil[]> {
    const response = await fetch(`${API_URL}/estado-civil`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener estados civiles');
    }

    return response.json();
  }

  async getById(id: string): Promise<EstadoCivil> {
    const response = await fetch(`${API_URL}/estado-civil/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener estado civil');
    }

    return response.json();
  }

  async create(data: CreateEstadoCivilDto): Promise<EstadoCivil> {
    const response = await fetch(`${API_URL}/estado-civil`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear estado civil');
    }

    return response.json();
  }

  async update(id: string, data: UpdateEstadoCivilDto): Promise<EstadoCivil> {
    const response = await fetch(`${API_URL}/estado-civil/${id}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar estado civil');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/estado-civil/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar estado civil');
    }
  }
}

export const estadoCivilService = new EstadoCivilService();
