import api from '@/lib/axios';
import { Alerta, DashboardAlertas, CodigoAlerta, AlertasQueryParams } from '@/types';

export const alertasService = {
  async getDashboard(): Promise<DashboardAlertas> {
    const response = await api.get<DashboardAlertas>('/alertas/dashboard');
    return response.data;
  },

  async getCodigos(): Promise<CodigoAlerta[]> {
    const response = await api.get<CodigoAlerta[]>('/alertas/codigos');
    return response.data;
  },

  async getAlertas(params?: AlertasQueryParams): Promise<Alerta[]> {
    const response = await api.get<Alerta[]>('/alertas', { params });
    return response.data;
  },

  async getAlertasByAfiliado(afiliadoId: string): Promise<Alerta[]> {
    const response = await api.get<Alerta[]>(`/alertas/afiliado/${afiliadoId}`);
    return response.data;
  },

  async getById(id: string): Promise<Alerta> {
    const response = await api.get<Alerta>(`/alertas/${id}`);
    return response.data;
  },

  async marcarVista(id: string): Promise<Alerta> {
    const response = await api.patch<Alerta>(`/alertas/${id}/vista`);
    return response.data;
  },

  async resolver(id: string): Promise<Alerta> {
    const response = await api.patch<Alerta>(`/alertas/${id}/resolver`);
    return response.data;
  },

  async descartar(id: string): Promise<Alerta> {
    const response = await api.patch<Alerta>(`/alertas/${id}/descartar`);
    return response.data;
  }
};
