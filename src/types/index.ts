// User types
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  administradoraId: string; // Nueva propiedad
  administradoraName: string; // Nueva propiedad
}

// Administradora types
export interface Administradora {
  id: string;
  name: string;
  cuit: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
}

// Disability Certificate types
export interface DisabilityCertificate {
  id: string;
  patientId: string;
  administradoraId: string; // Nueva propiedad
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

// Admin types
export interface Category {
  id: string;
  name: string;
  description: string;
  code: string;
  administradoraId: string; // Nueva propiedad
}

export interface Nomenclator {
  id: string;
  code: string;
  description: string;
  category: string;
  price?: number;
  administradoraId: string; // Nueva propiedad
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
  certificates: DisabilityCertificate[];
  administradoras: string[]; // IDs de administradoras que atienden a este paciente
}
