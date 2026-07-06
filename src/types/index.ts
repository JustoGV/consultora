// ============================================
// TIPOS DEL BACKEND (API NestJS)
// ============================================

export type UserRole = 'superadmin' | 'admin' | 'user';

// ============================================
// PAGINACIÓN SERVER-SIDE (OPT-IN)
// ============================================
// El backend expone paginación opt-in en los listados: sin `?page=&limit=`
// devuelve el array completo (comportamiento actual, sin cambios). Pasando
// esos params devuelve el envelope `PaginatedResponse<T>` de abajo.
// Ver AUD-24 / docs de handoff para el listado de endpoints habilitados.

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  personaId: string;
  persona: Persona;
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
  personaId?: string;
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

// El registro público solo crea usuarios rol=USER. El alta de ADMIN/SUPERADMIN
// (con rol + administradoraId) se hace vía POST /auth/usuarios (solo SUPERADMIN).
export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
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
  obraSocialPredeterminadaId?: string | null;
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

// Obras Sociales
export interface ObraSocial {
  id: string;
  nombre: string;
  sigla?: string;
  codigo?: string;
  descripcion?: string;
  activo: boolean;
  administradoraId: string;
  administradora?: Administradora;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObraSocialDto {
  nombre: string;
  sigla?: string;
  codigo?: string;
  descripcion?: string;
  administradoraId: string;
  activo?: boolean;
}

export interface UpdateObraSocialDto {
  nombre?: string;
  sigla?: string;
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
  obraSocialId?: string;
  obraSocial?: ObraSocial;
  administradoraId: string;
  administradora?: Administradora;
  activo: boolean;
  aderentes?: Aderente[];
  tercerosVinculados?: PersonaTercerosVinculado[];
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
  obraSocialId?: string;
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
  antecedentes?: string;
  personaId: string;
  persona?: Persona;
  tipoDiscapacidadId: string;
  tipoDiscapacidadIds?: string[];
  tipoDiscapacidad?: TipoDiscapacidad;
  tipos?: TipoDiscapacidad[];
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
  antecedentes?: string;
  personaId: string;
  tipoDiscapacidadId?: string;
  tipoDiscapacidadIds: string[];
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
  personaId?: string;
  antecedentes?: string;
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

// Aderentes
export interface Aderente {
  id: string;
  nombre: string;
  apellido: string;
  caracterAfiliado: string;
  numeroAfiliado: string;
  afiliadoId: string;
  afiliado?: Afiliado;
  telefono?: string;
  direccion?: string;
  email?: string;
  codigoPostal?: string;
  administradoraId: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAderenteDto {
  nombre: string;
  apellido: string;
  caracterAfiliado: string;
  afiliadoId: string;
  administradoraId: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  codigoPostal?: string;
  activo?: boolean;
}

export interface UpdateAderenteDto {
  nombre?: string;
  apellido?: string;
  caracterAfiliado?: string;
  afiliadoId?: string;
  administradoraId?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  codigoPostal?: string;
  activo?: boolean;
}

// ============================================
// MÓDULOS DE LA REFORMA (F-4) — Persona / Afiliacion / Parentesco / Profesional
// ============================================
// RN-21 (terminología): en código (estos types, services, rutas de API) todo
// se llama `persona`/`personas`. En UI visible (labels, textos) todo dice
// "Paciente"/"Pacientes" — eso se aplica recién en F-5, acá solo el modelo.

export type TipoDocumento = 'DNI' | 'CUIL' | 'PASAPORTE' | 'OTRO';

/**
 * Persona — reemplazo de `Afiliado` en la reforma B-4. Identidad de la persona,
 * separada de su membresía con obras sociales (ver `Afiliacion`).
 * NO tiene `edad` (se calcula en frontend desde `fechaNacimiento`) ni
 * `numeroAfiliado`/`plan` (viven en `Afiliacion`).
 */
export interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  cuil?: string;
  fechaNacimiento: string;
  sexo?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  estadoCivilId?: string;
  estadoCivil?: EstadoCivil;
  activo: boolean;
  administradoraId: string;
  administradora?: Administradora;
  afiliaciones?: Afiliacion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaDto {
  nombre: string;
  apellido: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento: string;
  cuil?: string;
  fechaNacimiento: string;
  sexo?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  estadoCivilId?: string;
  administradoraId: string;
  activo?: boolean;
}

export type UpdatePersonaDto = Partial<CreatePersonaDto>;

export interface FindPersonasQuery {
  search?: string;
  rol?: 'TITULAR' | 'ADHERENTE' | 'SIN_AFILIACION';
  obraSocialId?: string;
}

export type RolAfiliacion = 'TITULAR' | 'ADHERENTE';

/**
 * Afiliacion — membresía de una `Persona` con una `ObraSocial` (carnet propio +
 * rol). Separada de la identidad (Persona) y de la dependencia (AfiliacionVinculo).
 */
export interface Afiliacion {
  id: string;
  personaId: string;
  persona?: Persona;
  obraSocialId: string;
  obraSocial?: ObraSocial;
  rol: RolAfiliacion;
  numeroAfiliado?: string;
  plan?: string;
  fechaAlta?: string;
  observaciones?: string;
  activo: boolean;
  administradoraId: string;
  administradora?: Administradora;
  vinculosComoTitular?: AfiliacionVinculo[];
  vinculosComoAdherente?: AfiliacionVinculo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAfiliacionDto {
  personaId: string;
  obraSocialId: string;
  rol: RolAfiliacion;
  numeroAfiliado?: string;
  plan?: string;
  fechaAlta?: string;
  observaciones?: string;
  administradoraId: string;
  activo?: boolean;
}

export type UpdateAfiliacionDto = Partial<CreateAfiliacionDto>;

export interface FindAfiliacionesQuery {
  personaId?: string;
  obraSocialId?: string;
  rol?: RolAfiliacion;
}

/**
 * AfiliacionVinculo — dependencia ("a cargo de") entre dos afiliaciones de la
 * MISMA obra social (titular <-> adherente).
 */
export interface AfiliacionVinculo {
  id: string;
  afiliacionAdherenteId: string;
  afiliacionAdherente?: Afiliacion;
  afiliacionTitularId: string;
  afiliacionTitular?: Afiliacion;
  parentescoId: string;
  parentesco?: Parentesco;
  observaciones?: string;
  activo: boolean;
  administradoraId: string;
  administradora?: Administradora;
  createdAt: string;
  updatedAt: string;
}

/**
 * CreateVinculoDto — NO lleva `afiliacionAdherenteId`: se infiere del `:id` de
 * la URL (`POST /afiliaciones/:id/vinculos`, donde `:id` es la afiliación adherente).
 */
export interface CreateVinculoDto {
  afiliacionTitularId: string;
  parentescoId: string;
  observaciones?: string;
}

/** Parentesco — catálogo GLOBAL (sin administradoraId). */
export interface Parentesco {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParentescoDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export type UpdateParentescoDto = Partial<CreateParentescoDto>;

/**
 * Profesional — quien EJECUTA la prestación (a diferencia de `Efector`, quien
 * FACTURA). Con administradoraId.
 */
export interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidad?: string;
  cuit?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  activo: boolean;
  administradoraId: string;
  administradora?: Administradora;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfesionalDto {
  nombre: string;
  apellido: string;
  matricula: string;
  especialidad?: string;
  cuit?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  administradoraId: string;
  activo?: boolean;
}

export type UpdateProfesionalDto = Partial<CreateProfesionalDto>;

export interface FindProfesionalesQuery {
  search?: string;
}
