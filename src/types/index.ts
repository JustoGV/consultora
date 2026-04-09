// ============================================
// TIPOS DEL BACKEND (API NestJS)
// ============================================

export type UserRole = 'superadmin' | 'admin' | 'user';

// ============================================
// MÓDULO DE ALERTAS
// ============================================

export type PrioridadAlerta = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' | 'INFO';

export type EstadoAlerta = 'PENDIENTE' | 'VISTA' | 'RESUELTA' | 'DESCARTADA';

export type EntidadOrigenAlerta =
  | 'certificados_discapacidad'
  | 'orientaciones_prestacionales'
  | 'afiliados';

export interface PosibleSolucion {
  texto: string;
  accion: 'ver_certificado' | 'ver_orientacion' | 'listar_orientaciones' | 'renovar_certificado' | 'cargar_certificado' | null;
}

export interface CodigoAlerta {
  id: string;
  codigo: number;
  descripcion: string;
  prioridad: PrioridadAlerta;
  validezHoras: number | null;
  mensajePlantilla: string;
  posiblesSoluciones: PosibleSolucion[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alerta {
  id: string;
  codigoAlertaId: string;
  codigoAlerta: CodigoAlerta;
  afiliadoId: string;
  afiliado: Afiliado;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadAlerta;
  estado: EstadoAlerta;
  entidadOrigen: EntidadOrigenAlerta;
  entidadOrigenId: string;
  fechaObjetivo: string | null;
  resueltaPorId: string | null;
  resueltaPor?: User | null;
  resueltaEn: string | null;
  validaHasta: string | null;
  notasResolucion: string | null;
  administradoraId: string;
  administradora: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAlertas {
  total: number;
  pendientes: number;
  vistas: number;
  resueltas: number;
  descartadas: number;
  porPrioridad: {
    critica: number;
    alta: number;
    media: number;
    baja: number;
    info: number;
  };
}

export interface AlertasQueryParams {
  estado?: EstadoAlerta;
  prioridad?: PrioridadAlerta;
  afiliadoId?: string;
  codigoNumerico?: number;
  entidadOrigenId?: string;
}

// ============================================
// ALERTAS CLÍNICAS (UI/MOCK)
// ============================================

export type AlertLevel = 'info' | 'warning' | 'critical';

export type AlertUserType = UserRole;

export interface ClinicalMetric {
  id: string;
  patientId: string;
  metricType: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  registeredBy: string;
  notes?: string;
}

export interface AlertRelatedPerson {
  id: string;
  nombre: string;
}

export interface AlertAction {
  fecha: string;
  descripcion: string;
  usuarioId: string;
}

export interface Alert {
  id: string;
  tipoUsuario: AlertUserType;
  nivelGravedad: AlertLevel;
  administradoraId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  accionSugerida: string;
  metricaRelacionada: string;
  activa: boolean;
  escalada: boolean;
  motivoEscalamiento?: string;
  paciente?: AlertRelatedPerson;
  adminRelacionado?: AlertRelatedPerson;
  accionTomada?: AlertAction;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertFilters {
  tipoUsuario?: AlertUserType;
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
  codigoPrestacion: string;
  costoUnitario: string;
  costoEtapa1: string;
  costoEtapa2: string;
  costoEtapa3: string;
  fechaVigenciaActual: string;
  fechaVigenciaEtapa1: string;
  fechaVigenciaEtapa2: string;
  fechaVigenciaEtapa3: string;
  unidadMedida: string;
  porcentajeAumentoTotal: string;
  administradoraId: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNomencladorDto {
  costoUnitario: number;
  costoEtapa1: number;
  costoEtapa2: number;
  costoEtapa3: number;
  fechaVigenciaActual: string;
  fechaVigenciaEtapa1: string;
  fechaVigenciaEtapa2: string;
  fechaVigenciaEtapa3: string;
  unidadMedida: string;
  administradoraId: string;
}

export interface UpdateNomencladorDto {
  costoUnitario?: number;
  costoEtapa1?: number;
  costoEtapa2?: number;
  costoEtapa3?: number;
  fechaVigenciaActual?: string;
  fechaVigenciaEtapa1?: string;
  fechaVigenciaEtapa2?: string;
  fechaVigenciaEtapa3?: string;
  unidadMedida?: string;
  activo?: boolean;
}

export type TipoServicio = 'NOMENCLADO' | 'NO_NOMENCLADO';

export interface Servicio {
  id: string;
  titulo: string;
  categoriaId: string;
  categoria?: Categoria;
  nomencladorId?: string;
  nomenclador?: Nomenclador;
  tipoServicio?: TipoServicio;
  administradoraId: string;
  orientaciones?: OrientacionPrestacional[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicioDto {
  titulo: string;
  categoriaId: string;
  nomencladorId?: string;
  tipoServicio?: TipoServicio;
}

export interface UpdateServicioDto {
  titulo?: string;
  categoriaId?: string;
  nomencladorId?: string;
  tipoServicio?: TipoServicio;
  activo?: boolean;
}

export type PrioridadOrientacion = 'ALTA' | 'MEDIA' | 'BAJA';

// ============================================
// MÓDULO EFECTORES Y PRESTADORES
// ============================================

export type TipoEfector = 'PERSONA_FISICA' | 'PERSONA_JURIDICA';

export interface Efector {
  id: string;
  nombre: string;
  tipo: TipoEfector;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  administradoraId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEfectorDto {
  nombre: string;
  tipo: TipoEfector;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  administradoraId: string;
}

export interface UpdateEfectorDto {
  nombre?: string;
  tipo?: TipoEfector;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface Prestador {
  id: string;
  efectorId: string;
  efector?: Efector;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrestadorDto {
  efectorId: string;
  administradoraId: string;
}

export interface UpdatePrestadorDto {
  activo?: boolean;
}

// ============================================
// MÓDULO SERVICIOS NO NOMENCLADOS
// ============================================

export type ConvenioServicio = 'CON_CONVENIO' | 'SIN_CONVENIO';

export interface ServicioNoNomenclado {
  id: string;
  titulo: string;
  convenio: ConvenioServicio;
  prestadorId: string;
  prestador?: Prestador;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicioNoNomencladoDto {
  titulo: string;
  convenio: ConvenioServicio;
  prestadorId: string;
  administradoraId: string;
}

export interface UpdateServicioNoNomencladoDto {
  titulo?: string;
  convenio?: ConvenioServicio;
  prestadorId?: string;
}

export interface AddServicioNoNomencladoDto {
  servicioNoNomencladoId: string;
}

export interface OrientacionPrestacional {
  id: string;
  titulo: string;
  edadDesde: number | null;
  edadHasta: number | null;
  prioridad: PrioridadOrientacion;
  administradoraId: string;
  servicios?: Servicio[];
  serviciosNoNomenclados?: ServicioNoNomenclado[];
  certificados?: CertificadoDiscapacidad[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrientacionPrestacionalDto {
  titulo: string;
  edadDesde?: number;
  edadHasta?: number;
  prioridad: PrioridadOrientacion;
}

export interface UpdateOrientacionPrestacionalDto {
  titulo?: string;
  edadDesde?: number;
  edadHasta?: number;
  prioridad?: PrioridadOrientacion;
  activo?: boolean;
}

export interface AddServicioDto {
  servicioId: string;
}

export interface AddCertificadoDto {
  certificadoDiscapacidadId: string;
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
export type NivelAlertaCertificado = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface Diagnostico {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiagnosticoDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

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
  tipoDiscapacidadIds?: string[];
  tipoDiscapacidad?: TipoDiscapacidad;
  diagnosticoId?: string;
  diagnostico?: Diagnostico;
  nivelAlerta?: NivelAlertaCertificado;
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
  tipoDiscapacidadIds?: string[];
  diagnosticoId?: string;
  nivelAlerta?: NivelAlertaCertificado;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateCertificadoDiscapacidadDto {
  numeroCertificado?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  grado?: string;
  afiliadoId?: string;
  tipoDiscapacidadId?: string;
  tipoDiscapacidadIds?: string[];
  diagnosticoId?: string;
  nivelAlerta?: NivelAlertaCertificado;
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
