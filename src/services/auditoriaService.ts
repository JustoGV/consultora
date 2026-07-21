import api from '@/lib/axios';
import { FindAuditoriaQuery, PaginatedResponse, RegistroAuditoria } from '@/types';

/**
 * Servicio de auditoría — read-only (log append-only, sin create/update/delete),
 * por eso no usa crudFactory. Estilo espejo de alertasService.
 */
export const auditoriaService = {
  async getPaginated(query: FindAuditoriaQuery): Promise<PaginatedResponse<RegistroAuditoria>> {
    const response = await api.get<PaginatedResponse<RegistroAuditoria>>('/auditoria', { params: query });
    return response.data;
  },
};
