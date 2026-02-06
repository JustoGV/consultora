// ============================================
// TIPOS DEL BACKEND (API NestJS)
// ============================================

export type UserRole = 'superadmin' | 'admin' | 'user';

// ============================================
// SISTEMA DE ALERTAS CLÍNICAS
// ============================================

export type AlertLevel = 'info' | 'warning' | 'critical';
export type MetricStatus = 'normal' | 'warning' | 'critical';

export interface MetricRange {
  normal: { min: number; max: number };
  warning: { min: number; max: number };
  critical: { min: number; max: number };
}

export interface ClinicalMetric {
  id: string;
  patientId: string;
  metricType: string; // ej: 'presion_arterial', 'glucosa', 'peso', etc.
  value: number;
  unit: string;
  status: MetricStatus;
  timestamp: string;
  registeredBy: string; // ID del usuario que registró
  notes?: string;
}

export interface Alert {
  id: string;
  tipoUsuario: UserRole;
  nivelGravedad: AlertLevel;
  titulo: string;
  descripcion: string;
  administradoraId: string; // ID de la administradora
  paciente?: {
    id: string;
    nombre: string;
    documentNumber?: string;
  };
  adminRelacionado?: {
    id: string;
    nombre: string;
  };
  fecha: string;
  accionSugerida: string;
  metricaRelacionada?: string; // ID de la métrica
  activa: boolean;
  escalada: boolean;
  motivoEscalamiento?: string;
  accionTomada?: {
    fecha: string;
    descripcion: string;
    usuarioId: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AlertGenerationRule {
  metricType: string;
  ranges: MetricRange;
  evaluationFrequency: 'immediate' | 'daily' | 'weekly';
  escalationThreshold: number; // horas sin acción
}

export interface CreateAlertDto {
  tipoUsuario: UserRole;
  nivelGravedad: AlertLevel;
  titulo: string;
  descripcion: string;
  pacienteId?: string;
  adminRelacionadoId?: string;
  accionSugerida: string;
  metricaRelacionadaId?: string;
}

export interface AlertFilters {
  tipoUsuario?: UserRole;
  nivelGravedad?: AlertLevel;
  activa?: boolean;
  escalada?: boolean;
  pacienteId?: string;
  adminRelacionadoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  // NOTE: El backend removió `apellido`. Ahora usar `nombre` y opcionalmente cargar la administradora por ID.
  rol: UserRole;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
  administradoraId?: string | null; // UUID o null (superadmin)
}

export interface AuthResponse {
  token: string;  // El backend devuelve 'token', no 'access_token'
  usuario: User;  // El backend devuelve 'usuario', no 'user'
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  rol?: UserRole;
  administradoraId?: string | null; // Requerido si rol === 'admin'
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateCategoriaDto {
  nombre?: string;
  descripcion?: string;
}

export interface Administradora {
  id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateAdministradoraDto {
  nombre: string;
  codigo?: string;
  descripcion?: string;
}

export interface UpdateAdministradoraDto {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
}

export interface Nomenclador {
  id: string;
  nombre: string;
  categoriaId: string;
  administradoraId: string;
  codigoPrestacion?: string;
  descripcion?: string;
  porcentajeAumentoTotal?: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  categoria?: Categoria;
  administradora?: Administradora;
}

export interface CreateNomencladorDto {
  nombre: string;
  categoriaId: string;
  administradoraId: string;
  codigoPrestacion?: string;
  descripcion?: string;
  porcentajeAumentoTotal?: number;
}

export interface UpdateNomencladorDto {
  nombre?: string;
  categoriaId?: string;
  administradoraId?: string;
  codigoPrestacion?: string;
  descripcion?: string;
  porcentajeAumentoTotal?: number;
}

export type EtapaValor = 'vigente' | 'etapa1' | 'etapa2' | 'etapa3';

export interface ValorNomenclador {
  id: string;
  nomencladorId: string;
  valor: number;
  fechaVigencia: string;
  etapa: EtapaValor;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  nomenclador?: Nomenclador;
}

export interface CreateValorNomencladorDto {
  nomencladorId: string;
  valor: number;
  fechaVigencia: string;
  etapa?: EtapaValor;
  descripcion?: string;
}

export interface UpdateValorNomencladorDto {
  nomencladorId?: string;
  valor?: number;
  fechaVigencia?: string;
  etapa?: EtapaValor;
  descripcion?: string;
}

export interface DisabilityCertificate {
  id: string;
  patientId: string;
  administradoraId: string;
  uploadDate: string;
  fileName: string;
  fileUrl: string;
  extractedData?: CertificateData;
}

export interface CertificateData {
  patientName: string;
  documentNumber: string;
  dateOfBirth: string;
  gender: string;
  disability: string;
  disabilityLevel: string;
  category: string;
  nomenclator: string;
  issueDate: string;
  expiryDate: string;
  certifyingDoctor: string;
  observations?: string;
}

export interface Patient {
  id: string;
  name: string;
  documentNumber: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  administradoras: string[];
  certificates: DisabilityCertificate[];
}

export type Category = Categoria;
export type Nomenclator = Nomenclador;

// ============================================
// MÓDULOS DE GESTIÓN DE AFILIADOS
// ============================================

// Estado Civil
export interface EstadoCivil {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEstadoCivilDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateEstadoCivilDto {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
}

// Tipo de Discapacidad
export interface TipoDiscapacidad {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipoDiscapacidadDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateTipoDiscapacidadDto {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  activo?: boolean;
}

// Terceros Vinculados
export interface TercerosVinculado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  edad: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTercerosVinculadoDto {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  edad: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateTercerosVinculadoDto {
  nombre?: string;
  apellido?: string;
  dni?: string;
  fechaNacimiento?: string;
  edad?: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

// Afiliados
export interface Afiliado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  edad: number;
  sexo: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  numeroAfiliado: string;
  plan: string;
  estadoCivilId?: string;
  estadoCivil?: EstadoCivil;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAfiliadoDto {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  edad: number;
  sexo: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  numeroAfiliado: string;
  plan: string;
  estadoCivilId?: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateAfiliadoDto {
  nombre?: string;
  apellido?: string;
  dni?: string;
  fechaNacimiento?: string;
  edad?: number;
  sexo?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  numeroAfiliado?: string;
  plan?: string;
  estadoCivilId?: string;
  activo?: boolean;
}

// Certificados de Discapacidad
export interface CertificadoDiscapacidad {
  id: string;
  numeroCertificado: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  grado: string;
  observaciones?: string;
  afiliadoId: string;
  afiliado?: Afiliado;
  tipoDiscapacidadId: string;
  tipoDiscapacidad?: TipoDiscapacidad;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificadoDiscapacidadDto {
  numeroCertificado: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  grado: string;
  observaciones?: string;
  afiliadoId: string;
  tipoDiscapacidadId: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateCertificadoDiscapacidadDto {
  numeroCertificado?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  grado?: string;
  observaciones?: string;
  afiliadoId?: string;
  tipoDiscapacidadId?: string;
  activo?: boolean;
}

// Relaciones Persona-Terceros
export interface PersonaTercerosVinculado {
  id: string;
  tipoRelacion: string;
  observaciones?: string;
  afiliadoId: string;
  afiliado?: Afiliado;
  tercerosVinculadoId: string;
  tercerosVinculado?: TercerosVinculado;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaTercerosVinculadoDto {
  tipoRelacion: string;
  observaciones?: string;
  afiliadoId: string;
  tercerosVinculadoId: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdatePersonaTercerosVinculadoDto {
  tipoRelacion?: string;
  observaciones?: string;
  afiliadoId?: string;
  tercerosVinculadoId?: string;
  activo?: boolean;
}
