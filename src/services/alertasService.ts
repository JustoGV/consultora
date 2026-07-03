import api from '@/lib/axios';
import { Alerta, DashboardAlertas, CodigoAlerta, AlertasQueryParams, PaginatedResponse, PaginationParams } from '@/types';

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

  /** Paginación server-side opt-in. No reemplaza a getAlertas(); usar cuando se migre la UI. */
  async getAlertasPaginated(params: AlertasQueryParams & PaginationParams): Promise<PaginatedResponse<Alerta>> {
    const response = await api.get<PaginatedResponse<Alerta>>('/alertas', { params });
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

  async resolver(id: string, notasResolucion?: string): Promise<Alerta> {
    const response = await api.patch<Alerta>(`/alertas/${id}/resolver`, notasResolucion ? { notasResolucion } : undefined);
    return response.data;
  },

  async descartar(id: string, notasResolucion?: string): Promise<Alerta> {
    const response = await api.patch<Alerta>(`/alertas/${id}/descartar`, notasResolucion ? { notasResolucion } : undefined);
    return response.data;
  }
};
