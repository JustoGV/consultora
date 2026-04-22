import api from '@/lib/axios';
import {
  OrientacionPrestacional,
  CreateOrientacionPrestacionalDto,
  UpdateOrientacionPrestacionalDto,
  AddServicioDto,
  AddServicioNoNomencladoDto,
  AddCertificadoDto
} from '@/types';

export const orientacionPrestacionalService = {
  async getAll(): Promise<OrientacionPrestacional[]> {
    const response = await api.get<OrientacionPrestacional[]>('/orientacion-prestacional');
    return response.data;
  },

  async getById(id: string): Promise<OrientacionPrestacional> {
    const response = await api.get<OrientacionPrestacional>(`/orientacion-prestacional/${id}`);
    return response.data;
  },

  async create(data: CreateOrientacionPrestacionalDto): Promise<OrientacionPrestacional> {
    const response = await api.post<OrientacionPrestacional>('/orientacion-prestacional', data);
    return response.data;
  },

  async update(id: string, data: UpdateOrientacionPrestacionalDto): Promise<OrientacionPrestacional> {
    const response = await api.patch<OrientacionPrestacional>(`/orientacion-prestacional/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/orientacion-prestacional/${id}`);
  },

  async restore(id: string): Promise<OrientacionPrestacional> {
    const response = await api.patch<OrientacionPrestacional>(`/orientacion-prestacional/${id}/restore`);
    return response.data;
  },

  async addServicio(id: string, data: AddServicioDto): Promise<OrientacionPrestacional> {
    const response = await api.post<OrientacionPrestacional>(`/orientacion-prestacional/${id}/servicios`, data);
    return response.data;
  },

  async removeServicio(id: string, servicioId: string): Promise<void> {
    await api.delete(`/orientacion-prestacional/${id}/servicios/${servicioId}`);
  },

  async addServicioNoNomenclado(id: string, data: AddServicioNoNomencladoDto): Promise<OrientacionPrestacional> {
    const response = await api.post<OrientacionPrestacional>(
      `/orientacion-prestacional/${id}/servicios-no-nomenclados`,
      data
    );
    return response.data;
  },

  async removeServicioNoNomenclado(id: string, servicioId: string): Promise<void> {
    await api.delete(`/orientacion-prestacional/${id}/servicios-no-nomenclados/${servicioId}`);
  },

  async addCertificado(id: string, data: AddCertificadoDto): Promise<OrientacionPrestacional> {
    const response = await api.post<OrientacionPrestacional>(`/orientacion-prestacional/${id}/certificados`, data);
    return response.data;
  },

  async removeCertificado(id: string, certificadoId: string): Promise<void> {
    await api.delete(`/orientacion-prestacional/${id}/certificados/${certificadoId}`);
  },

  async getRecomendaciones(certificadoId: string, edad: number): Promise<OrientacionPrestacional[]> {
    const response = await api.get<OrientacionPrestacional[]>('/orientacion-prestacional/recomendaciones', {
      params: { certificadoId, edad }
    });
    return response.data;
  }
};
