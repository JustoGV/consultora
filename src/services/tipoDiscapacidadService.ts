import { TipoDiscapacidad, CreateTipoDiscapacidadDto, UpdateTipoDiscapacidadDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';

class TipoDiscapacidadService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAll(): Promise<TipoDiscapacidad[]> {
    const response = await fetch(`${API_URL}/tipo-discapacidad`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener tipos de discapacidad');
    }

    return response.json();
  }

  async getById(id: string): Promise<TipoDiscapacidad> {
    const response = await fetch(`${API_URL}/tipo-discapacidad/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener tipo de discapacidad');
    }

    return response.json();
  }

  async create(data: CreateTipoDiscapacidadDto): Promise<TipoDiscapacidad> {
    const response = await fetch(`${API_URL}/tipo-discapacidad`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear tipo de discapacidad');
    }

    return response.json();
  }

  async update(id: string, data: UpdateTipoDiscapacidadDto): Promise<TipoDiscapacidad> {
    const response = await fetch(`${API_URL}/tipo-discapacidad/${id}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar tipo de discapacidad');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/tipo-discapacidad/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar tipo de discapacidad');
    }
  }
}

export const tipoDiscapacidadService = new TipoDiscapacidadService();
