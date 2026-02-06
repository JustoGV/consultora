import { CertificadoDiscapacidad, CreateCertificadoDiscapacidadDto, UpdateCertificadoDiscapacidadDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://consultora-ten-back.fly.dev';

class CertificadosDiscapacidadService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAll(): Promise<CertificadoDiscapacidad[]> {
    const response = await fetch(`${API_URL}/certificados-discapacidad`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener certificados de discapacidad');
    }

    return response.json();
  }

  async getById(id: string): Promise<CertificadoDiscapacidad> {
    const response = await fetch(`${API_URL}/certificados-discapacidad/${id}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener certificado de discapacidad');
    }

    return response.json();
  }

  async create(data: CreateCertificadoDiscapacidadDto): Promise<CertificadoDiscapacidad> {
    const response = await fetch(`${API_URL}/certificados-discapacidad`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear certificado de discapacidad');
    }

    return response.json();
  }

  async update(id: string, data: UpdateCertificadoDiscapacidadDto): Promise<CertificadoDiscapacidad> {
    const response = await fetch(`${API_URL}/certificados-discapacidad/${id}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar certificado de discapacidad');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/certificados-discapacidad/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar certificado de discapacidad');
    }
  }
}

export const certificadosDiscapacidadService = new CertificadosDiscapacidadService();
