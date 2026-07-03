import api from '@/lib/axios';
import { CertificadoDiscapacidad, CreateCertificadoDiscapacidadDto, UpdateCertificadoDiscapacidadDto, PaginatedResponse, PaginationParams } from '@/types';

class CertificadosDiscapacidadService {
  async getAll(): Promise<CertificadoDiscapacidad[]> {
    const response = await api.get<CertificadoDiscapacidad[]>('/certificados-discapacidad');
    return response.data;
  }

  /** Paginación server-side opt-in. No reemplaza a getAll(); usar cuando se migre la UI. */
  async getPaginated(params: PaginationParams): Promise<PaginatedResponse<CertificadoDiscapacidad>> {
    const response = await api.get<PaginatedResponse<CertificadoDiscapacidad>>('/certificados-discapacidad', { params });
    return response.data;
  }

  async getById(id: string): Promise<CertificadoDiscapacidad> {
    const response = await api.get<CertificadoDiscapacidad>(`/certificados-discapacidad/${id}`);
    return response.data;
  }

  async create(data: CreateCertificadoDiscapacidadDto): Promise<CertificadoDiscapacidad> {
    const response = await api.post<CertificadoDiscapacidad>('/certificados-discapacidad', data);
    return response.data;
  }

  async update(id: string, data: UpdateCertificadoDiscapacidadDto): Promise<CertificadoDiscapacidad> {
    const response = await api.patch<CertificadoDiscapacidad>(`/certificados-discapacidad/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/certificados-discapacidad/${id}`);
  }
}

export const certificadosDiscapacidadService = new CertificadosDiscapacidadService();
