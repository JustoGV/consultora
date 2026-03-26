import { Diagnostico } from '@/types';

// Hardcoded diagnoses — will be replaced with backend endpoint when available
const DIAGNOSTICOS_MOCK: Diagnostico[] = [
  { id: 'diag-001', codigo: 'F70', nombre: 'Retraso mental leve', activo: true },
  { id: 'diag-002', codigo: 'F71', nombre: 'Retraso mental moderado', activo: true },
  { id: 'diag-003', codigo: 'F72', nombre: 'Retraso mental grave', activo: true },
  { id: 'diag-004', codigo: 'F73', nombre: 'Retraso mental profundo', activo: true },
  { id: 'diag-005', codigo: 'F84.0', nombre: 'Autismo infantil', activo: true },
  { id: 'diag-006', codigo: 'F84.5', nombre: 'Síndrome de Asperger', activo: true },
  { id: 'diag-007', codigo: 'G71.0', nombre: 'Distrofia muscular', activo: true },
  { id: 'diag-008', codigo: 'G80', nombre: 'Parálisis cerebral infantil', activo: true },
  { id: 'diag-009', codigo: 'H54', nombre: 'Deficiencia visual', activo: true },
  { id: 'diag-010', codigo: 'H90', nombre: 'Hipoacusia conductiva y neurosensorial', activo: true },
  { id: 'diag-011', codigo: 'Q90', nombre: 'Síndrome de Down', activo: true },
  { id: 'diag-012', codigo: 'G35', nombre: 'Esclerosis múltiple', activo: true },
  { id: 'diag-013', codigo: 'G20', nombre: 'Enfermedad de Parkinson', activo: true },
  { id: 'diag-014', codigo: 'M05', nombre: 'Artritis reumatoide seropositiva', activo: true },
  { id: 'diag-015', codigo: 'F20', nombre: 'Esquizofrenia', activo: true },
  { id: 'diag-016', codigo: 'F31', nombre: 'Trastorno afectivo bipolar', activo: true },
  { id: 'diag-017', codigo: 'G40', nombre: 'Epilepsia', activo: true },
  { id: 'diag-018', codigo: 'Q05', nombre: 'Espina bífida', activo: true },
  { id: 'diag-019', codigo: 'G12.2', nombre: 'Enfermedad de la neurona motora', activo: true },
  { id: 'diag-020', codigo: 'Z89', nombre: 'Amputación de miembro', activo: true },
];

class DiagnosticosService {
  async getAll(): Promise<Diagnostico[]> {
    // TODO: Replace with API call when backend endpoint is available:
    // const response = await api.get<Diagnostico[]>('/diagnosticos');
    // return response.data;
    return Promise.resolve(DIAGNOSTICOS_MOCK.filter(d => d.activo));
  }

  async getById(id: string): Promise<Diagnostico | undefined> {
    return Promise.resolve(DIAGNOSTICOS_MOCK.find(d => d.id === id));
  }
}

export const diagnosticoService = new DiagnosticosService();
