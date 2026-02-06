import { Afiliado, CreateAfiliadoDto, UpdateAfiliadoDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';

class AfiliadosService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAll(): Promise<Afiliado[]> {
    const response = await fetch(`${API_URL}/afiliados`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener afiliados');
    }

    return response.json();
  }

  async getById(id: string): Promise<Afiliado> {
    const response = await fetch(`${API_URL}/afiliados/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener afiliado');
    }

    return response.json();
  }

  async create(data: CreateAfiliadoDto): Promise<Afiliado> {
    const response = await fetch(`${API_URL}/afiliados`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear afiliado');
    }

    return response.json();
  }

  async update(id: string, data: UpdateAfiliadoDto): Promise<Afiliado> {
    const response = await fetch(`${API_URL}/afiliados/${id}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar afiliado');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/afiliados/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar afiliado');
    }
  }
}

export const afiliadosService = new AfiliadosService();
