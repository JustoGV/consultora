import api from '@/lib/axios';
import { ValorNomenclador, CreateValorNomencladorDto, UpdateValorNomencladorDto, EtapaValor } from '@/types';

export const valorNomencladorService = {
  async getByNomenclador(nomencladorId: string): Promise<ValorNomenclador[]> {
    const response = await api.get<ValorNomenclador[]>(`/valores-nomenclador/nomenclador/${nomencladorId}`);
    return response.data;
  },

  async getVigente(nomencladorId: string): Promise<ValorNomenclador | null> {
    const response = await api.get<ValorNomenclador>(`/valores-nomenclador/nomenclador/${nomencladorId}/vigente`);
    return response.data;
  },

  async getByEtapa(nomencladorId: string, etapa: EtapaValor): Promise<ValorNomenclador | null> {
    const response = await api.get<ValorNomenclador>(`/valores-nomenclador/nomenclador/${nomencladorId}/etapa/${etapa}`);
    return response.data;
  },

  async getById(id: string): Promise<ValorNomenclador> {
    const response = await api.get<ValorNomenclador>(`/valores-nomenclador/${id}`);
    return response.data;
  },

  async create(data: CreateValorNomencladorDto): Promise<ValorNomenclador> {
    const response = await api.post<ValorNomenclador>('/valores-nomenclador', data);
    return response.data;
  },

  async update(id: string, data: UpdateValorNomencladorDto): Promise<ValorNomenclador> {
    const response = await api.patch<ValorNomenclador>(`/valores-nomenclador/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/valores-nomenclador/${id}`);
  }
};
